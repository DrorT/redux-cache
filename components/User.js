import React, { Component, PropTypes } from 'react'
import {connect} from 'react-redux';
import {walkCache} from '../redux-cache/redux-cache';
import Counter from './Counter';

const mapStateToProps = () =>
  walkCache({ user: {$type:'ref', $entity:'user', $id:'1'} });

@connect(mapStateToProps)
export default class User extends Component {
  render() {
    const { user } = this.props;
    return (
      <div>
        <p>
          {JSON.stringify(user)}
        </p>
        <Counter location={["counters","inUser"]}/>
      </div>
    )
  }
}