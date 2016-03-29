import {parse, visit} from 'graphql/language';
import {printAST, mergeRecursive, assign as assignFn, appendChangeToState} from './helpers';

/**
 * a getter for the state, to get an
 * follows references of format defined at getPathFromRef
 * path of '/' will return to state root
 * @param state - the redux full state, or at least this is assumed to be the full state, for following refs
 * @param path - an array of paths to follow
 * @param startLocation - starting position in the state (the root of the object)
 * @param options -
 *    followRefs - if to follow references in the state
 *    returnPartial - if to return a partial object marking how far down in the state we managed to get till we are missing data
 */
export const getFromState = (state, path = undefined, startLocation = undefined, options={followRefs: true, returnPartial:false})=>{
  if(path===undefined)
    return state;
  let {followRefs, returnPartial} = options;
  startLocation = startLocation || state;
  let currentLocation = startLocation;
  let currentLocationPath = [];
  for(let idx=0; idx<path.length; idx++){
    let pathPart = path[idx];
    if(pathPart == '/'){
      currentLocation = state;
      continue;
    }
    if(!currentLocation.hasOwnProperty(pathPart)) {
      if(!returnPartial)
        return undefined;
      else
        return {exists: false, deepestPath: currentLocationPath, deepestData: currentLocation, pathLeft:path.slice(idx)};
    } else {
      // TODO - check for array - what shall we do then?
      currentLocation = currentLocation[pathPart];
      currentLocationPath.push(pathPart);
      let pathFromRef = getPathFromRef(currentLocation, state);
      if(pathFromRef){
        if(followRefs){
          let result = getFromState(state, pathFromRef.concat(path.slice(idx+1)), state, {followRefs, returnPartial});
          // if could not find the reference
          if((result=={})||(result.deepestPath&&result.deepestPath.length<=currentLocation['$path'].length)){
            return {exists: false, deepestPath: currentLocationPath, deepestData: currentLocation, pathLeft:path.slice(idx)};
          } else if(result.deepestPath) {
            // partial result
            return {exists: false, deepestPath: currentLocationPath.concat(result.deepestPath.slice(currentLocation.path.length)), deepestData: result.deepestData, pathLeft:result.pathLeft};
          } else {
            //final result
            return result;
          }
        } else {
          return currentLocation;
        }
      }
    }
  }
  return currentLocation;
};

/**
 * 2 types of references are supported - {$type:'ref', $path:["path","to","object"]} or {$type:'ref', $entity:'EntityName', $id:'entityId'}
 * This function changes both to a path array
 * The real use of this is if we decide to have a specific location for normalized data. At the moment assumption is it is at the state root
 * @param ref object described above
 * @returns {*}
 */
export const getPathFromRef = (ref, state=undefined) =>{
  if(typeof ref==="object" && ref['$type'] && ref['$type']==='ref') {
    if (ref['$path'] !== undefined) {
      if (Array.isArray(ref['$path']))
        return ref['$path'];
      else if (typeof ref['$path'] === 'string')
        return [ref['$path']];
    } else if (ref['$entity'] !== undefined){
      if(state && state.cache !== undefined)
        return ['cache', ref['$entity'], ref['$id']];
      else
        return [ref['$entity'], ref['$id']];
    }
  }
  return undefined;
};

export const get = (state, path)=> getFromState(state, path, undefined, {followRefs:false, returnPartial:false});
export const getIn = (state, path, startLocation)=> getFromState(state, path, startLocation, {followRefs:false, returnPartial:false});
export const set = (state, path, data)=> appendChangeToState(path, state, data);

/**
 * based on state, start location and a graphQL like fragment returns the data from the state
 * Also returns a structure of dependencies and of missing data in case some is missing, for missing data also returns reduced AST
 * @param state
 * @param dataAST
 * @param startPoint - the starting point for the AST, can be an object of type reference or a path array
 */
export const getTree = (state, dataAst, startPoint = undefined) => {
  let path = startPoint = getPathFromRef(startPoint, state) || startPoint;
  let startLocation = getFromState(state, startPoint, undefined, {followRefs: false});
  if(!startLocation)
    return undefined;
  if(!dataAst)
    return {result: startLocation, missing: undefined, printedMissing: '{}', missingNormalized: {}, dependenciesNormalized:{}, dependenciesArray:[path], missingArray:[]};

  // create AST from fragments
  dataAst = typeof dataAst === 'string' ? parse(dataAst) : dataAst;

  if (Array.isArray(startLocation)) {
    return startLocation.map((val) => {
      return getTreeFromStartAndAST(val, dataAst);
    });
  } else
    return getTreeFromStartAndAST(startLocation, dataAst);

  function getTreeFromStartAndAST(stateStartPoint, ast) {
    // visit the AST using graphql depth 1st
    let result = {};
    let currentLocation = result;
    let locationStack = [];
    let locationInState = stateStartPoint;
    let doNothing = false;
    let missingNormalized = {};
    let missingArray = [];
    let dependenciesNormalized ={};
    let dependenciesArray = [];

    const visitor = {
      Field: {
        enter(node) {
          if(!doNothing) {
            let newPath = getPathFromRef(locationInState);
            if (newPath){
              path = newPath;
              locationInState = getFromState(state, newPath);
            }
            path = path.concat([node.name.value]);
            let stateValue = getFromState(state, [node.name.value], locationInState);
            // if there is no data no reason to go down this tree
            if (!stateValue) {
              assignFn(missingNormalized, path, node);
              missingArray.push(path);
              path = path.slice(0,-1);
              return false;
            }
            assignFn(dependenciesNormalized, path, node);
            dependenciesArray.push(path);
            // if node has selectionSet we are still going lower
            if (!node.selectionSet) {
              // this is the final value and should be added
              // TODO - if array get the limit and offset argument and copy only part of the array
              currentLocation[node.name.value] = stateValue;
              // adds the data to be dependant data for result
              path = path.slice(0,-1);
              // returns null to remove the subtree from the graphql AST showing we have the data already
              return null;
            } else {
              locationStack.push(locationInState);
              locationInState = stateValue;
              let resultAST;
              if (Array.isArray(locationInState)) {
                // TODO - get the limit and offset argument and copy only part of the array
                currentLocation[node.name.value] = [];
                let oldLocation = currentLocation;
                let oldPath = path;
                let baseLocation = currentLocation[node.name.value];
                let ASTarray = locationInState.map((location, idx)=> {
                  baseLocation[idx] = {};
                  currentLocation = baseLocation[idx];
                  // optimization so references are only checked for once
                  locationInState = location;
                  return visit(node.selectionSet, visitor);
                });
                currentLocation = oldLocation;
                path = oldPath;
                resultAST = ASTarray.reduce((prev, curr)=> {
                  return mergeRecursive(prev, curr, true);
                }, {});
              } else {
                let oldLocation = currentLocation;
                currentLocation[node.name.value] = {};
                currentLocation = currentLocation[node.name.value];
                resultAST = visit(node.selectionSet, visitor);
                currentLocation = oldLocation;
              }
              locationInState = locationStack.pop();
              path = path.slice(0,-1);
              if (resultAST.selections.length > 0) {
                // this is a workaround graphql Visitor not working as expected -
                // if this function return a new node value it will start walking that data (not what I want)
                // if this function returns false or null it will not call the leave fucntion
                // so the below code, minimizes the unnecessary walking of the tree, while still getting leave function called to update the result node value
                node.newSelectionSet = resultAST;
                doNothing = true;
                return {...node, selectionSet: {...node.newSelectionSet, selections:[]}};
              }
              else
                return null;
            }
          }
        },
        leave(node, key, parent, path, ancestors){
          if(doNothing && node.newSelectionSet!==undefined){
            doNothing = false;
            return {...node, selectionSet: node.newSelectionSet, newSelectionSet:undefined};
          }
        }
      }
    };
    const missing = visit(ast, visitor);
    return {result, missing, printedMissing: printAST(missing), missingNormalized, dependenciesNormalized, dependenciesArray, missingArray};
  }
};

/**
 * uses getTree to get the needed data, can memoize result to a specific place or "in place"
 * @param state
 * @param dataAst
 * @param startPoint
 * @param options - are:
 *    memoize - true/false
 *    memoizeInPlace - if true will add the data to the startLocation object
 *    memoizeDestinationPath - if inPlace is false will use this path as the destination for the data, this is a relative path starting at start point
 */
export const getDataAndMemoize = (state, dataAst, startPoint = undefined, options={}) => {
  let {memoize, memoizeInPlace, memoizeDestinationPath} = options;
  memoize = memoize===undefined ? true : memoize;
  memoizeInPlace = memoizeInPlace===undefined ? true : memoizeInPlace;
  let result = getTree(state, dataAst, startPoint);
  if(memoize){
    startPoint = getPathFromRef(startPoint) || startPoint;
    if(!memoizeInPlace && memoizeDestinationPath)
      startPoint = startPoint.concat(memoizeDestinationPath);
    // TODO - set should return new tree
    set(state, startPoint, result.result);
  }
  return result;
};
