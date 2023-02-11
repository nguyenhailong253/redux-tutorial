import {
  createAsyncThunk,
  createSlice,
  nanoid,
  createSelector,
  createEntityAdapter,
} from '@reduxjs/toolkit'
// import { sub } from 'date-fns'
import { client } from '../../api/client'

// const initialState = [
//   {
//     id: '1',
//     title: 'First Post!',
//     content: 'Hello!',
//     date: sub(new Date(), { minutes: 10 }).toISOString(),
//     reactions: { thumbsUp: 0, hooray: 0, heart: 0, rocket: 0, eyes: 0 },
//   },
//   {
//     id: '2',
//     title: 'Second Post',
//     content: 'More text',
//     date: sub(new Date(), { minutes: 5 }).toISOString(),
//     reactions: { thumbsUp: 0, hooray: 0, heart: 0, rocket: 0, eyes: 0 },
//   },
// ]

/**
 * createAsyncThunk accepts two arguments:
 * - A string that will be used as the prefix for the generated action types
 * - A "payload creator" callback function that should return a Promise containing some data, or a rejected Promise with an error
 * 
 * 
 For basic usage, the only type you need to provide for createAsyncThunk is the type of 
 the single argument for your payload creation callback. 
 You should also ensure that the return value of the callback is typed correctly

 https://redux.js.org/usage/usage-with-typescript#typing-createasyncthunk
 */
export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
  const response = await client.get('/fakeApi/posts')
  return response.data
})

export const addNewPost = createAsyncThunk(
  'posts/addNewPost',
  // The payload creator receives the partial `{title, content, user}` object
  async (initialPost) => {
    // We send the initial data to the fake API server
    const response = await client.post('/fakeApi/posts', initialPost)
    // The response includes the complete post object, including unique ID
    return response.data
  }
)

/**
 * "Normalized state" means that:

We only have one copy of each particular piece of data in our state, so there's no duplication
Data that has been normalized is kept in a lookup table, where the item IDs are the keys, and the items themselves are the values.
There may also be an array of all of the IDs for a particular item type

We should use normalized states

--------------------------------------------------

Managing normalized state with createEntityAdapter

Redux Toolkit's createEntityAdapter API provides a standardized way to store your data 
in a slice by taking a collection of items and putting them into the shape of 
{ ids: [], entities: {} }. Along with this predefined state shape, it generates a set of 
reducer functions and selectors that know how to work with that data.
 */

// https://redux.js.org/usage/usage-with-typescript#typing-createentityadapter
const postsAdapter = createEntityAdapter({
  // createEntityAdapter accepts an options object that may include a sortComparer function,
  // which will be used to keep the item IDs array in sorted order by comparing two items
  sortComparer: (a, b) => b.date.localeCompare(a.date),
})

// the adapter object has a getInitialState function that generates an empty {ids: [], entities: {}}
// object. You can pass in more fields to getInitialState, and those will be merged in (e.g status, error, etc)
const initialState = postsAdapter.getInitialState({
  status: 'idle',
  error: null,
})

// const initialState = {
//   posts: [],
//   status: 'idle',
//   error: null,
// }

// const postsSlice = createSlice({
//   name: 'posts',
//   initialState,
//   reducers: {
//     // slice-specific reducers here
//     // postAdded: {
//     //   reducer(state, action) {
//     //     state.posts.push(action.payload)
//     //   },
//     /**
//      *
//     If you want to add a meta or error property to your action, or customize the payload
//     of your action, you have to use the prepare notation for defining the case reducer

//     The "prepare callback" function can take multiple arguments, generate random
//     values like unique IDs, and run whatever other synchronous logic is needed to
//     decide what values go into the action object
//      */

//     //   prepare(title, content, userId) {
//     //     return {
//     //       payload: {
//     //         id: nanoid(),
//     //         user: userId,
//     //         content,
//     //         title,
//     //         date: new Date().toISOString(),
//     //         reactions: { thumbsUp: 0, hooray: 0, heart: 0, rocket: 0, eyes: 0 },
//     //       },
//     //     }
//     //   },
//     // },
//     postUpdated(state, action) {
//       const { id, title, content } = action.payload
//       // const existingPost = state.posts.find((post) => post.id === id)
//       const existingPost = state.entities[id]
//       if (existingPost) {
//         existingPost.title = title
//         existingPost.content = content
//       }
//     },
//     reactionAdded(state, action) {
//       const { postId, reaction } = action.payload
//       // const existingPost = state.posts.find((post) => post.id === id)
//       const existingPost = state.entities[postId]
//       if (existingPost) {
//         existingPost.reactions[reaction]++
//       }
//     },
//   },
//   // builder callback form
//   extraReducers: (builder) => {
//     // same with syntax: "extraReduers: (builder) => {}"
//     /**
//      * In this case, we need to listen for the "pending" and "fulfilled" action types
//      * dispatched by our fetchPosts thunk. Those action creators are attached to our
//      * actual fetchPost function, and we can pass those to extraReducers to listen for
//      * those actions:
//      */
//     builder
//       .addCase(fetchPosts.pending, (state, action) => {
//         state.status = 'loading'
//       })
//       .addCase(fetchPosts.fulfilled, (state, action) => {
//         // state.status = 'succeeded'
//         // state.posts = state.posts.concat(action.payload)

//         // Use the `upsertMany` reducer as a mutating update utility
//         // add all of the incoming posts to the state, by passing in the draft state and the array of posts (action.payload)
//         // if any items in action.payload already existing in our state, the upsertMany function will merge them together based on matching IDs.
//         console.log(action.payload)
//         state.status = 'succeeded'
//         postsAdapter.upsertMany(state, action.payload)
//       })
//       .addCase(fetchPosts.rejected, (state, action) => {
//         state.status = 'failed'
//         state.error = action.error.message
//       })
//       // .addCase(addNewPost.fulfilled, (state, action) => {
//       //   // We can directly add the new post object to our posts array
//       //   state.posts.push(action.payload)
//       // })
//       .addCase(addNewPost.fulfilled, postsAdapter.addOne)
//   },
// })

// export const { postAdded, postUpdated, reactionAdded } = postsSlice.actions

// export default postsSlice.reducer

// export const selectAllPosts = (state) => state.posts.posts

// export const selectPostById = (state, postId) =>
//   state.posts.posts.find((post) => post.id === postId)

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
  // Pass in a selector that returns the posts slice of state
} = postsAdapter.getSelectors((state) => state.posts)

/**
 * Memoizing Selector Functions
createSelector takes one or more "input selector" functions as argument, plus an
 "output selector" function. When we call selectPostsByUser(state, userId), 
 createSelector will pass all of the arguments into each of our input selectors. 
 Whatever those input selectors return becomes the arguments for the output selector.
   */
export const selectPostsByUser = createSelector(
  [selectAllPosts, (state, userId) => userId], // Since the user ID is the second argument we're passing into selectPostsByUser, we can write a small selector that just returns userId
  (posts, userId) => posts.filter((post) => post.user === userId)
)
/*

Data fetching logic for Redux typically follows a predictable pattern:

- A "start" action is dispatched before the request, to indicate that the request is in progress. 
This may be used to track loading state to allow skipping duplicate requests or show loading 
indicators in the UI.

- The async request is made

- Depending on the request result, the async logic dispatches either a "success" action 
containing the result data, or a "failure" action containing error details. The reducer 
logic clears the loading state in both cases, and either processes the result data from 
the success case, or stores the error value for potential display.

*/
