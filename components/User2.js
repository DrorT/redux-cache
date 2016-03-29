import React, { Component, PropTypes } from 'react'
import {walkState, bindOperationToActionCreators} from 'redux-operations';
import {connect} from 'react-redux';
import {walkCache} from '../redux-cache/cache';

const mapStateToProps = () =>
  walkCache((state,props)=>{
    return { user: {$type:'ref', $entity:'user', $id:props.id, query:'{firstname, lastname}'} };
  });

@connect(mapStateToProps)
export default class User2 extends Component {
  render() {
    const { user, dispatch} = this.props;
    return (
      <div>
        <p>
          {JSON.stringify(user)}
        </p>
      </div>
    )
  }
}