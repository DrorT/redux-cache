import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Counter from '../components/Counter'
import ClickCounter from '../components/ClickCounter'
import MultiplyAll from '../components/MultiplyAll'
import AddDynamicCounters from '../components/AddDynamicCounters'
import AddToState from '../components/AddToState'
import User from '../components/User'
import User2 from '../components/User2'
import React, { Component, PropTypes } from 'react'

const topCounter = ['counters', 'top'];
const bottomCounter = ['counters', 'bottom'];

export default class Counters extends Component {
  render() {
    return (
      <div>
        <div className="instructions">
          Explore the api in devtools to see operation flow, args, and descriptions ---->
          <div>Your normal state is under userState</div>
        </div>
        <div className="plain-counter">
          <h2>1. Plain counter</h2>
          <Counter/>
        </div>
        <div className="add-to-state">
          <AddToState/>
        </div>
        <User />
      </div>
    )
  }
}
