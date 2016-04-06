import {operationReducerFactory, bindOperationToActionCreators} from 'redux-operations';
import {getTree, getPathFromRef, set, getFromState} from './cache';
import {appendChangeToState, traverse} from './helpers';
export const CACHE_SET = 'CACHE_SET';
export const CACHE_GET = 'CACHE_GET';

// Tree of locations in state, that in each path has everything that depends on that path
let dependeciesTree = {};
// array of denorm functions to run when their dependencies are called
let functionArray = [];
// object with keys as components Ids and true/false to inddicate a component should rendere

// 1st stage - keep the component ID and last props, if props not have changed and does not need to render then skip
// if needs to render or props changed renders and update props in hash
let componentDependenciesTree = {};
let componentRenders = {};
let idCounter = 1;

/**
 * An action creator - for declaring what data is needed by the client
 * @param startPoint
 * @param dataAst
 * @param options are:
 *    memoize - true/false
 *    memoizeInPlace - if true will add the data to the startLocation object
 *    memoizeDestinationPath - if inPlace is true, this is a relative path to the start object, otherwise it is a path from state start
 * @returns {{meta: {cache: boolean, startPoint: *, dataAst: *, options: {}}}}
 */
export const cacheGet = (startPoint, dataAst, options={memoize: false, memoizeInPlace: true, memoizeDestinationPath:[]}) => {
  return {
    type: CACHE_GET,
    meta: {
      cache: {
        startPoint,
        dataAst,
        options
      }
    }
  };
};

/**
 * An action creator - for setting normalized data in the state
 * @param path
 * @param data
 * @returns {{type: string, meta: {path: *, data: *}}}
 */
export const cacheSet = (path, data) => {
  return {
    type: CACHE_SET,
    meta: {
      cache: {
        path,
        data
      }
    }
  };
};

export const actionCreators = {cacheGet, cacheSet};

// the initial state to start the object with - should be initialized before coombineReducers
let initialState = {};

export const cache = (initialStateP={}) => {
  initialState = initialStateP;
  return operationReducerFactory('cache', initialState, {
    CACHE_GET: {
      resolve: (state, action)=> {
        const { startPoint, dataAst, options } = action.meta.cache;
        const tree = getTree ( state, dataAst, startPoint);
        let newState = state;
        // tree has - result, missingAST, printedMissing, missingNormalized, dependenciesNormalized, dependenciesArray, missingArray
        // TODO - if missing not empty should call transport layer for missing data
        // updates state if memoized was requested
        if(options.memoize){
          let path = [];
          if(options.memoizeInPlace)
            path = getPathFromRef(startPoint) || startPoint;
          if(options.memoizeDestinationPath)
            path = path.concat(options.memoizeDestinationPath);
          updateDependenciesFromPath(path);
          newState = set(state, path, tree.result);
        }
        return newState;
      }
    },
    CACHE_SET: {
      resolve: (state, action)=> {
        const { path, data } = action.meta.cache;
        let fullPath = getPathFromRef(path) || path;
        updateDependenciesFromPath(fullPath);
        return set(state, fullPath, data, false);
      }
    }
  });
};

/**
 * updates all components that depend on something in the path to rerender, meaning that it will go down the path and any component that depends on anything down the path will be marked for rerender
 * @param path
 */
const updateDependenciesFromPath = (path) => {
  let currentLocation = componentDependenciesTree;
  if(path[0] !== 'cache')
    currentLocation = currentLocation['cache'];
  for(let i =0; i<=path.length; i++){
    if(currentLocation) {
      if (currentLocation.hasOwnProperty("$dependants")) {
        Object.keys(currentLocation["$dependants"]).forEach((id)=> {
          if (componentRenders[id] !== undefined)
            componentRenders[id] = true;
          else
            delete currentLocation["$dependants"][id];
        });
      }
      currentLocation = currentLocation[path[i]];
    } else {
      break;
    }
    // should also invalidate anything that depends on lower levels than the level we got to, this is in case that any of the lower levels changed or was deleted
    if(currentLocation){
      traverse(currentLocation, (id)=>{
        if (componentRenders[id] !== undefined)
          componentRenders[id] = true;
      });
    }
  }
};

/**
 * Not to be cofused with redux-operatioms walkState - this one simply tries to get the element based on the path
 * @param locationInState
 * @param state
 * @returns {*} - whatever value it finds in the state or undefined
 */
export const walkCache = (pathsObject) => {
  let componentId;
  let previousProps = undefined;
  let previousResult = undefined;
  return (state, props)=> {
    // TODO - rearrange so dependency on props is only in case pathsObject is a function, otherwise the props can have no affect
    let startTime = Date.now();
    // in case the props changed remove the old componentId from the renders object
    if(componentId!==undefined && props !== previousProps)
      delete componentRenders[componentId];
    // if no componentId or props have change needs a new id.
    // if props change we get a new Id as this way we can have new dependencies
    if (!componentId || props !== previousProps)
      componentId = idCounter++;
    // gets current props object from the components dependencies object
    let currentComponent = componentRenders[componentId];
    // if we already have the component registered and for the same props
    if (currentComponent === false && previousProps === props) {
      let endTime = Date.now();
      console.log("walk cache in "+(endTime-startTime)+"ms");
      return previousResult;
    }
    componentRenders[componentId] = false;
    previousResult = {};
    previousProps = props;

    // if pathsObject is a function (depends on props) calculate its value
    let pObject = pathsObject;
    if(typeof pathsObject === 'function')
      pObject = pathsObject(state, props);
    let stateResult = {};
    Object.keys(pObject).forEach((key)=> {
      if (previousResult.hasOwnProperty(key))
        stateResult[key] = previousResult[key];
      else {
        let result = getFromCache(state, pObject[key], componentId);
        stateResult[key] = previousResult[key] = result;
      }
    });
    state.componentDependenciesTree = componentDependenciesTree;
    state.componentRenders = componentRenders;
    let endTime = Date.now(0);
    console.log("walk cache in "+(endTime-startTime)+"ms");
    return stateResult;
  }
};

/** simple get from cache with queryObject being one of a few options
 * @param state
 * @param queryObject -
 *    array - path from state root to data
 *    object with "path" key for start location and "query" - graphQL fragment for data needed
 *    object with "ref" key for start location and "query" - graphQL fragment for data needed
 * @param componentId - if available adds dependency for component on result locations
 */
const getFromCache = (state, queryObject, componentId) => {
  let result, dependencies;
  if(Array.isArray(queryObject)) {
    result = getFromState(state, queryObject);
    dependencies = [queryObject];
  } else {
    if (typeof queryObject !== 'object')
      return undefined;
    const ref = queryObject["path"] ? {$type: "ref", $path: queryObject["path"]} : queryObject;
    result = getTree(state, queryObject["query"], ref);
    if(result) {
      dependencies = result.missingArray.concat(result.dependenciesArray);
      result = result.result;
    }
  }
  if(result !== undefined && componentId!==undefined) {
    const componentObject = {};
    componentObject[componentId] = componentId;
    dependencies.forEach((dep)=> {
      componentDependenciesTree = appendChangeToState(dep.concat(["$dependants"]), componentDependenciesTree, componentObject);
    });
  }
  return result;
};