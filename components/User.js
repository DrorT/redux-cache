import React, { Component, PropTypes } from 'react'
import {walkState, bindOperationToActionCreators} from 'redux-operations';
import {connect} from 'react-redux';
import {walkCache} from '../redux-cache/cache';

const mapStateToProps = (state, props) =>
  walkCache({ user: {$type:'ref', $entity:'user', $id:'1'} });

@connect(mapStateToProps)
export default class User extends Component {
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