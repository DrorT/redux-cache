import {visit} from 'graphql/language';
export const printAST = (ast) => {
  let resultJson = '{';
  const visitor = {
    Field: {
      enter(node, key, parent, path, ancestors) {
        resultJson += node.name.value;
        if(node.arguments.length > 0)
          resultJson += "("+ node.arguments.map((arg)=>arg.name.value+":"+arg.value.value).join(',')+")";
        if (node.selectionSet)
          resultJson += ':{';
        else
          resultJson += ',';
      },
      leave(node) {
        if (node.selectionSet)
          resultJson = resultJson.endsWith(',') ?  resultJson.slice(0,-1)+'},' : resultJson+'},';
      }
    }
  };
  visit(ast, visitor);
  resultJson = resultJson.endsWith(',') ? resultJson.slice(0,-1)+'}' : resultJson+'}';
  return resultJson;
};

export const mergeRecursive = (obj1, obj2, ast = false) => {
  for (var p in obj2) {
    // Property in destination object set; update its value.
    if ( obj2[p] && obj2[p].constructor==Object ) {
      obj1[p] = obj1[p]!==undefined ? mergeRecursive(obj1[p], obj2[p]) : obj2[p];
    } else if (Array.isArray(obj2[p]) && Array.isArray(obj1[p])) {
      obj1[p] = obj1[p];
      obj2[p].forEach((val, idx) => {
        if(ast && obj1[p][idx].name.value !== val.name.value)
          obj1[p].push(val);
        else {
          debugger
          obj1[p][idx] = mergeRecursive(obj1[p][idx], val);
        }
      });
    } else {
      obj1[p] = obj2[p];
    }
  }
  return obj1;
};

export const assign = (obj, keyPath, value, deepMerge = false) =>{
  let lastKeyIndex = keyPath.length-1;
  for (let i = 0; i < lastKeyIndex; ++ i) {
    let key = keyPath[i];
    if (!(key in obj))
      obj[key] = {};
    obj = obj[key];
  }
  if(deepMerge&&(typeof obj[keyPath[lastKeyIndex]] === 'object' ))
    value = mergeRecursive(obj[keyPath[lastKeyIndex]], value);
  obj[keyPath[lastKeyIndex]] = value;
};

export const appendChangeToState = (locationInState, state, newSubState, deepMerge = true) => {
  const nextLocation = locationInState[0];
  if (locationInState.length === 1) {
    if(deepMerge)
      return {...state, [nextLocation]: mergeRecursive2(state[nextLocation], newSubState)};
    else
      return {...state, [nextLocation]: newSubState};
  } else {
    const subObject = appendChangeToState(locationInState.slice(1), state[nextLocation] || {}, newSubState);
    return {...state, [nextLocation]: subObject}
  }
};

export const mergeRecursive2 = (state, newState) => {
  if(typeof newState === 'object' && typeof state === 'object') {
    let newObj = {};
    Object.entries(newState).forEach((arr)=> {
      newObj [arr[0]] = mergeRecursive2(state[arr[0]] || {}, arr[1]);
    });
    return { ...state, ...newObj };
  }
  else
    return newState;
};

export const traverse = (o,func) => {
  for (var i in o) {
    func.apply(this,[i,o[i]]);
    if (o[i] !== undefined && typeof(o[i])=="object")
      traverse(o[i],func);
  }
}