import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import store from './app/store'
import { Provider } from 'react-redux'
import { extendedApiSlice, fetchUsers } from './features/users/usersSlice'

import { worker } from './api/server'

// Wrap app rendering so we can wait for the mock API to initialize
async function start() {
  // Start our mock API server
  await worker.start({ onUnhandledRequest: 'bypass' })

  // store.dispatch(fetchUsers())
  /**
  Manually dispatching an RTKQ request thunk will create a subscription entry, but it's 
  then up to you to unsubscribe from that data later - otherwise the data stays in the 
  cache permanently. In this case, we always need user data, so we can skip unsubscribing.
   */
  store.dispatch(extendedApiSlice.endpoints.getUsers.initiate()) // start query manually (not recommended, should use Hooks instead)

  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
    document.getElementById('root')
  )
}

start()
