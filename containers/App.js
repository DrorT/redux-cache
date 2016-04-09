import Counter from '../components/Counter'
import AddToState from '../components/AddToState'
import User2 from '../components/User2'
import User from '../components/User'
import CounterWithUser from '../components/CounterWithUser'
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
        <div>
          <h2>2. User</h2>
          <User2 id="1"/>
        </div>
        <div>
          <h2>3. Counter with User</h2>
          <CounterWithUser />
        </div>
      </div>
    )
  }
}
