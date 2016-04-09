import reqwest from 'reqwest';
import {normalize} from 'normalizr';
import {querySchema} from './normalizr-graphql/query';

/**
 * very simplistic solution for fetching missing data from server
 * Changes the data object into a graphql request and sends it to server, on data back calls a redux action to set the data.
 * @param missingData - an object of the structure of the missing data.
 * Assumptions are -
 *  1. head of object is 'cache' or 'query' or anything else, it does not matter as it gets ignored at this stage
 *  2. 2nd level in the object is the entity type, for example 'user'
 *  3. 3rd level in the object id
 *  4. everything below that is the needed data
 */

const serverDataUrl = "http://localhost:3001/graphql";
const schemaUrl = "http://localhost:3001/schema.json";
let serverJsonSchema;

export const fetchData = (missingDataObject)=>{
  let query = 'query '+objectToGraphql(missingDataObject['cache']);
  const getData = reqwest({
    url: serverDataUrl,
    type: 'json',
    method: 'POST',
    data: query,
    contentType: 'application/graphql',
  });
  const getSchema = new Promise((resolve, reject) => {
    if(serverJsonSchema !== undefined)
      resolve(serverJsonSchema);
    else {
      reqwest(schemaUrl).then((response)=> {
        serverJsonSchema = response;
        resolve(serverJsonSchema);
      }, (...err)=> {
        reject(err);
      });
    }
  });
  return Promise.all([getSchema, getData])
    .then((resp) => {
      const queryAST = querySchema(JSON.parse(resp[0]), query);
      const normalizedData = normalize(resp[1], queryAST.schema);
      const newDataArray = newDataToEntities(normalizedData.entities);
      return newDataArray;
    }, (err, msg) => {
      console.log('error - ', err, msg);
    });
};

/**
 * Takes a javascript object and returns a graphql query based on some assumpitons
 * @param object - assumptions are the same as fetchData but one level down (this gets what is under the 'cache', 'query')
 */
const objectToGraphql = (object) => {
  if(typeof object !== 'object')
    return;
  // 1st two levels are the entity and id parameters
  return '{' +
    Object.keys(object).map((key)=>{
      return Object.keys(object[key]).map((id)=>{
        return key.toLowerCase()+'_'+id+':'+key.toLowerCase()+'(id:'+id+')'+objectLevelToGraphQl(object[key][id]);
      }).join(',');
    }).join(',')+
    '}';
};

const objectLevelToGraphQl = (objectPartial) => {
  if(objectPartial === undefined)
    return '';
  if(typeof objectPartial === 'object') {
    let keys = Object.keys(objectPartial);
    if(keys.length === 0 )
      return '';
    // need to climb down the tree
    return ' {'+ keys.map((key)=>{
        return key+objectLevelToGraphQl(objectPartial[key]);
      }).join(',') +
      '}';
  } else {
    // a string
    return objectPartial;
  }
};

/**
 * gets an object and return an array of arrays, each array has the entity to be changed and new data
 * @param object - object with the 2 top levels being the entity type and id
 */
const newDataToEntities = (object) =>{
  let resultArray = [];
  Object.keys(object).forEach((key)=>{
    return Object.keys(object[key]).forEach((id)=>{
      resultArray.push([{$type:'ref', $entity:key, $id:id}, object[key][id]]);
    });
  });
  return resultArray;
}