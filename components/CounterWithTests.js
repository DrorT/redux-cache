import React, { Component, PropTypes } from 'react'
import {walkState, bindOperationToActionCreators} from 'redux-operations';
import {actionCreators, counter as counterReducer} from '../ducks/counter';
import {connect} from 'react-redux';
import {getFromState, getTree, getDataAndMemoize} from '../redux-cache/cache';
import { appendChangeToState } from '../redux-cache/helpers';
import User2 from './User2';

const mapStateToProps = (state, props) => {
  //let a = getFromState(state, ['user', 1, 'lastname'], undefined, false);
  //let a1 = getFromState(state, ['user', 1, 'friends', 0]);
  //let a2 = getFromState(state, ['user', 1, 'friends', 0], undefined, false);
  //let a3 = getFromState(state, ['user', 1, 'friends', 0, 'lastname'], undefined, false);
  //let a4 = getFromState(state, ['user', 'lastname1'], undefined, false, true);
  //debugger
  //var path = ['user', 1, 'lastname'];
  //const result = getFromState(state, path, undefined, {assign:true, assignData:'NewName'});
  //
  //let t1 = getTree(state, `{
  //  firstname,
  //  id,
  //  email,
  //  friends {
  //    id,
  //    firstname,
  //    email,
  //    friends {
  //      firstname,
  //      lastname
  //    }
  //  },
  //  lastname
  //}`, ['user', 1])
  //
  //var path = ['user', 1, 'lastname'];
  //var query = `{
  //                  firstname,
  //                  id,
  //                  friends {
  //                      firstname
  //                  },
  //                  lastname
  //              }`;
  //let t2 = getDataAndMemoize(state, query, ['user', 1]);



  //const t1 = {
  //  1: {
  //    id:1,
  //    firstname: 'John',
  //    lastname: 'Silver',
  //    friends: [{$type: 'ref', $path: ["user", 3]}]
  //  },
  //  3: {
  //    id:3,
  //    firstname: 'Jack',
  //    lastname: 'Black',
  //    friends: [{$type: 'ref', $entity: "user", $id:5}, {$type: 'ref', $path: ["user", 1]}]
  //  },
  //  5: {
  //    id:5,
  //    firstname: 'Dan',
  //    //lastname: 'Brown'
  //  }
  //};
  //
  //let t2 = appendChangeToState(["1"], t1, {friends:[{firstname:"dror"}]});

  return {
    counter: props.location ? walkState(props.location, state, counterReducer, this) : state.counter
  }
};

@connect(mapStateToProps)
export default class Counter extends Component {
  render() {
    const { location, counter, dispatch} = this.props;
    const {increment, decrement, incrementIfOdd,
      incrementAsync, setFromFetch, setCounter} = bindOperationToActionCreators(location, counterReducer, actionCreators);
    return (
      <div>
        <p>
          Value: {counter} times
          {' '}
          <button onClick={() => dispatch(increment())}>+</button>
          {' '}
          <button onClick={() => dispatch(decrement())}>-</button>
          {' '}
          <button onClick={() => dispatch(incrementIfOdd())}>+ if odd</button>
          {' '}
          <button onClick={() => dispatch(incrementAsync())}>Async +</button>
          {'   '}
          <button onClick={() => dispatch(setFromFetch())}>Fetch random promise</button>
          {'   '}
          <input type="text" ref="setInput" size="3" defaultValue="0"/>
          <button onClick={() => dispatch(setCounter(this.refs['setInput'].value))}>Set input</button>
          {' '}
        </p>
        <User2 id={counter} />
      </div>
    )
  }
}