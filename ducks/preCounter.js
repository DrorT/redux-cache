import {operationReducerFactory, bindOperationToActionCreators} from 'redux-operations';
import {INCREMENT_COUNTER} from './counter';

const initialState = 0;
export const preCounter = operationReducerFactory('preCounter', initialState, {
  INCREMENT_COUNTER: {
    priority: -10,
    resolve: (state, action)=> {
      debugger
      if(action.meta.operations.locationInState)
        action.meta.operations.locationInState.push("new");
      return state;
    }
  }
});

