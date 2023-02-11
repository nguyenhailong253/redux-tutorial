import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createAction,
  isAnyOf,
} from '@reduxjs/toolkit'
import { forceGenerateNotifications } from '../../api/server'
import { apiSlice } from '../api/apiSlice'
import { client } from '../../api/client'

// Using RTK Query-------------------------------------------
const notificationsReceived = createAction(
  'notifications/notificationsReceived'
)

export const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => '/notifications',
      // arg cache key as its first parameter, and an options object with the thunkApi values as the second parameter
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        // The options object also contains an updateCachedData util function, and two lifecycle Promises - cacheDataLoaded and cacheEntryRemoved. cacheDataLoaded resolves when the initial data for this subscription is added to the store
        // create a websocket connection when the cache subscription starts
        const ws = new WebSocket('ws://localhost')
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          // when data is received from the socket connection to the server,
          // update our query result with the received message
          const listener = (event) => {
            const message = JSON.parse(event.data)
            switch (message.type) {
              case 'notifications': {
                updateCachedData((draft) => {
                  // Insert all received notifications from the websocket
                  // into the existing RTKQ cache array
                  draft.push(...message.payload)
                  draft.sort((a, b) => b.date.localeCompare(a.date))
                })
                // Dispatch an additional action so we can track "read" state
                dispatch(notificationsReceived(message.payload))
                break
              }
              default:
                break
            }
          }

          ws.addEventListener('message', listener)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active (0 subscribers)
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        ws.close()
      },
    }),
  }),
})

export const { useGetNotificationsQuery } = extendedApi

const emptyNotifications = []

export const selectNotificationsResult =
  extendedApi.endpoints.getNotifications.select()

const selectNotificationsData = createSelector(
  selectNotificationsResult,
  (notificationsResult) => notificationsResult.data ?? emptyNotifications
)

export const fetchNotificationsWebsocket = () => (dispatch, getState) => {
  const allNotifications = selectNotificationsData(getState())
  const [latestNotification] = allNotifications
  const latestTimestamp = latestNotification?.date ?? ''
  // Hardcode a call to the mock server to simulate a server push scenario over websockets
  forceGenerateNotifications(latestTimestamp)
}

// END -------------------------------------------

/**
 * 
For createAsyncThunk specifically, you can only pass in one argument, and whatever we 
pass in becomes the first argument of the payload creation callback.

The second argument to our payload creator is a thunkAPI object containing several useful 
functions and pieces of information:

- dispatch and getState: the actual dispatch and getState methods from our Redux store. 
You can use these inside the thunk to dispatch more actions, or get the latest Redux 
store state (such as reading an updated value after another action is dispatched).

- extra: the "extra argument" that can be passed into the thunk middleware when creating 
the store. This is typically some kind of API wrapper, such as a set of functions that 
know how to make API calls to your application's server and return data, so that your 
thunks don't have to have all the URLs and query logic directly inside.

- requestId: a unique random ID value for this thunk call. Useful for tracking status of 
an individual request.

- signal: An AbortController.signal function that can be used to cancel an in-progress request.

- rejectWithValue: a utility that helps customize the contents of a rejected action if the thunk receives an error
 */

// export const fetchNotifications = createAsyncThunk(
//   'notifications/fetchNotifications',
//   // destructure the getState function out of the thunkAPI object
//   async (_, { getState }) => {
//     const allNotifications = selectAllNotifications(getState())
//     // Since the array of notifications is sorted newest first, we can grab the latest one using array destructuring.
//     const [latestNotification] = allNotifications
//     const latestTimestamp = latestNotification ? latestNotification.date : ''
//     const response = await client.get(
//       `/fakeApi/notifications?since=${latestTimestamp}`
//     )
//     return response.data
//   }
// )

// const notificationsAdapter = createEntityAdapter({
//   sortComparer: (a, b) => b.date.localeCompare(a.date),
// })

const notificationsAdapter = createEntityAdapter()

const matchNotificationsReceived = isAnyOf(
  notificationsReceived, // when server pushed a notif
  extendedApi.endpoints.getNotifications.matchFulfilled // when client first requests sever
)

const notificationsSlice = createSlice({
  name: 'notifications',
  //   initialState: [],
  initialState: notificationsAdapter.getInitialState(),
  reducers: {
    allNotificationsRead(state, action) {
      //   state.forEach((notification) => {
      //     notification.read = true
      //   })

      Object.values(state.entities).forEach((notification) => {
        notification.read = true
      })
    },
  },
  extraReducers: (builder) => {
    builder
    //   .addCase(fetchNotifications.fulfilled, (state, action) => {
    //     //   state.push(...action.payload)
    //     //   state.forEach((notification) => {
    //     //     // Any notifications we've read are no longer new
    //     //     notification.isNew = !notification.read
    //     //   })
    //     //   // Sort with newest first
    //     //   state.sort((a, b) => b.date.localeCompare(a.date))

    //     notificationsAdapter.upsertMany(state, action.payload)
    //     Object.values(state.entities).forEach((notification) => {
    //       // Any notifications we've read are no longer new
    //       notification.isNew = !notification.read
    //     })
    //   })
      // a case reducer that runs whenever we match one of those two action types
      .addMatcher(matchNotificationsReceived, (state, action) => {
        // Add client-side metadata for tracking new notifications
        // Modify notifs coming from action
        const notificationsMetadata = action.payload.map((notification) => ({
          id: notification.id,
          read: false,
          isNew: true,
        }))

        // Update existing notifs
        Object.values(state.entities).forEach((notification) => {
          // Any notifications we've read are no longer new
          notification.isNew = !notification.read
        })

        // Bulk insert new notifs from action
        notificationsAdapter.upsertMany(state, notificationsMetadata)
      })
  },
})

export default notificationsSlice.reducer

export const { allNotificationsRead } = notificationsSlice.actions

// export const selectAllNotifications = (state) => state.notifications

export const {
    selectAll: selectNotificationsMetadata,
    selectEntities: selectMetadataEntities
} = notificationsAdapter.getSelectors((state) => state.notifications)
