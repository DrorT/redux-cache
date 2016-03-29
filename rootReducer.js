import { combineReducers } from 'redux'
import {counter} from './ducks/counter'
import {clickCounter} from './ducks/clickCounter'
import {multiplyAll} from './ducks/multiplyAll'
import {user} from './ducks/userReducer'
import {cache} from './redux-cache/cache'

let cacheInitialState = {
  user:{
    1: {
      id:1,
      firstname: 'John',
      lastname: 'Silver',
      friends: [{$type: 'ref', $path: ["user", 3]}]
    },
    3: {
      id:3,
      firstname: 'Jack',
      lastname: 'Black',
      friends: [{$type: 'ref', $entity: "user", $id:5}, {$type: 'ref', $path: ["user", 1]}]
    },
    5: {
      id:5,
      firstname: 'Dan',
      //lastname: 'Brown'
    }
  }
};

export default combineReducers({
  counter,
  clickCounter,
  multiplyAll,
  user,
  cache: cache(cacheInitialState)
});
