import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from '@reduxjs/toolkit'
import { client } from '../../api/client'
import { apiSlice } from '../api/apiSlice'

const usersAdapter = createEntityAdapter()

const initialState = usersAdapter.getInitialState()
// const initialState = []

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await client.get('/fakeApi/users')
  return response.data
})

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // .addCase(fetchUsers.fulfilled, (state, action) => {
      // return action.payload
      // })
      // replaces the entire list of users with the array we fetched from the server with setAll
      .addCase(fetchUsers.fulfilled, usersAdapter.setAll)
  },
})

export default usersSlice.reducer

// export const selectAllUsers = (state) => state.users

// export const selectUserById = (state, userId) =>
//   state.users.find((user) => user.id === userId)
// export const { selectAll: selectAllUsers, selectById: selectUserById } =
//   usersAdapter.getSelectors((state) => state.users)

export const extendedApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/users',
      transformResponse: (responseData) => {
        return usersAdapter.setAll(initialState, responseData)
      },
    }),
  }),
})

export const { useGetUsersQuery } = extendedApiSlice

// Calling `someEndpoint.select(someArg)` generates a new selector that will return
// the query result object for a query with those parameters.
// To generate a selector for a specific query argument, call `select(theQueryArg)`.
// In this case, the users query has no params, so we don't pass anything to select()
export const selectUsersResult = apiSlice.endpoints.getUsers.select()

const selectUsersData = createSelector(
  selectUsersResult,
  (usersResult) => usersResult.data
)

export const { selectAll: selectAllUsers, selectById: selectUserById } =
  usersAdapter.getSelectors((state) => selectUsersData(state) ?? initialState)

// const emptyUsers = []
// export const selectAllUsers = createSelector(
//   selectUsersResult,
//   (usersResult) => usersResult?.data ?? emptyUsers
// )

// export const selectUserById = createSelector(
//   selectAllUsers,
//   (state, userId) => userId,
//   (users, userId) => users.find((user) => user.id === userId)
// )
