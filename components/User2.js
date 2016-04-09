import React, { Component, PropTypes } from 'react'
import {connect} from 'react-redux';
import {walkCache} from '../redux-cache/redux-cache';

const mapStateToProps = () =>
  walkCache((state,props)=>{
    return { user: {$type:'ref', $entity:'Hostel', $id:props.id, query:'{id, name, roomTypes{id,name}}'}, user1:  {$type:'ref', $entity:'Hostel', $id:parseInt(props.id)+1, query:'{id, name, email, roomTypes{id, name, rooms{id, name}}}'}};
  });

@connect(mapStateToProps)
export default class User2 extends Component {
  render() {
    const { user, user1, dispatch} = this.props;
    return (
      <div>
        <p>
          user:{JSON.stringify(user)}
        </p>
        <p>
          user1:{JSON.stringify(user1)}
        </p>
      </div>
    )
  }
}