import React, { Component, PropTypes } from 'react'
import {walkState} from 'redux-operations';
import {connect} from 'react-redux';
import {cacheSet} from '../redux-cache/redux-cache';


const mapStateToProps = state => {
  return {}
};

@connect(mapStateToProps)
export default class AddToState extends Component {
  render() {
    const { dispatch } = this.props;
    return (
      <div>
        <div>
          Location:<textarea ref="setLocation" cols="100" rows= "10" defaultValue = '{"$type":"ref", "$entity":"user", "$id":"1" }' />
        </div>
        <div>
          Data:<textarea ref="setData" cols="100" rows= "10" defaultValue='{ "firstname": "Dror", "email":"dror@dror.com" }' />
        </div>
        <button onClick={() => dispatch(cacheSet(JSON.parse(this.refs['setLocation'].value),JSON.parse(this.refs['setData'].value)))}>cache set</button>
      </div>
    )
  }
}
