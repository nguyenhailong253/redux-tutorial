// Import the RTK Query methods from the React-specific entry point
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Define our single API slice object
// Your application is expected to have only one createApi call in it. This one API slice should contain all endpoint definitions that talk to the same base URL
export const apiSlice = createApi({
  // The cache reducer expects to be added at `state.api` (already default - this is optional)
  reducerPath: 'api',
  // All of our requests will have URLs starting with '/fakeApi'
  baseQuery: fetchBaseQuery({ baseUrl: '/fakeApi' }),
  tagTypes: ['Post'], //  declaring an array of string tag names for data types
  // The "endpoints" represent operations and requests for this server
  endpoints: (builder) => ({
    // The `getPosts` endpoint is a "query" operation that returns data
    // or "mutations", which send an update to the server - builder.mutation()
    getPosts: builder.query({
      // The URL for the request is '/fakeApi/posts'
      // you can override that by returning an object like {url: '/posts', method: 'POST', body: newPost} instead of just the URL string itself.
      query: () => '/posts',
      providesTags: (result = [], error, arg) => [
        'Post', // provides a general 'Post' tag for the whole list, as well as a specific {type: 'Post', id} tag for each received post object
        ...result.map(({ id }) => ({ type: 'Post', id })),
      ], // in query endpoints, listing a set of tags describing the data in that query
    }),

    /**
    It's also important to note that the query parameter must be a single value! If you 
    need to pass through multiple parameters, you must pass an object containing multiple 
    fields (exactly the same as with createAsyncThunk)
     */
    getPost: builder.query({
      query: (postId) => `/posts/${postId}`,
      providesTags: (result, error, arg) => [{ type: 'Post', id: arg }], // provides a specific {type: 'Post', id} object for the individual post object
    }),
    addNewPost: builder.mutation({
      query: (initialPost) => ({
        url: '/posts',
        method: 'POST',
        // Include the entire post object as the body of the request
        body: initialPost, // automatically be JSON-serialized
      }),
      /**
    There is one caveat here. By specifying a plain 'Post' tag in getPosts and invalidating 
    it in addNewPost, we actually end up forcing a refetch of all individual posts as well. 
    If we really want to just refetch the list of posts for the getPost endpoint, you can 
    include an additional tag with an arbitrary ID, like {type: 'Post', id: 'LIST'}, and 
    invalidate that tag instead.

    https://redux-toolkit.js.org/rtk-query/usage/automated-refetching#tag-invalidation-behavior
       */
      invalidatesTags: ['Post'], // in mutation endpoints, listing a set of tags that are invalidated every time that mutation runs
    }),
    editPost: builder.mutation({
      query: (post) => ({
        url: `/posts/${post.id}`,
        method: 'PATCH',
        body: post,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Post', id: arg.id }], // invalidates the specific {type: 'Post', id} tag. This will force a refetch of both the individual post from getPost, as well as the entire list of posts from getPosts, because they both provide a tag that matches that {type, id} value
    }),
    // getUsers: builder.query({
    //   query: () => '/users',
    // }),
    addReaction: builder.mutation({
      query: ({ postId, reaction }) => ({
        url: `posts/${postId}/reactions`,
        method: 'POST',
        // In a real app, we'd probably need to base this on user ID somehow
        // so that a user can't do the same reaction more than once
        body: { reaction },
      }),
      //   invalidatesTags: (result, error, arg) => [ // we don't want to refetch the whole posts because this is a small state update, we use "optimistic update" instead
      //     { type: 'Post', id: arg.postId },
      //   ],
      async onQueryStarted({ postId, reaction }, { dispatch, queryFulfilled }) {
        // `updateQueryData` requires 2 params
        // The first is the cache key arg that was passed when the request started
        // The second is an object that contains some of the same fields as the thunkApi in createAsyncThunk ( {dispatch, getState, extra, requestId}), but also a Promise called queryFulfilled
        // so it knows which piece of cache state to update
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getPosts', undefined, (draft) => {
            // 3 arguments: the name of the endpoint to update, the same cache key value used to identify the specific cached data, and a callback that updates the cached data
            // The `draft` is Immer-wrapped and can be "mutated" like in createSlice
            const post = draft.find((post) => post.id === postId)
            if (post) {
              post.reactions[reaction]++
            }
          })
        )
        try {
          // When we dispatch that action, the return value is a patchResult object. If we call patchResult.undo(), it automatically dispatches an action that reverses the patch diff changes.
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

// Export the auto-generated hook for the `getPosts` query endpoint
/**
The hooks are automatically named based on a standard convention:

- "use", the normal prefix for any React hook
- The name of the endpoint, capitalized
- The type of the endpoint, Query or Mutation
 */
export const {
  useGetPostsQuery,
  useGetPostQuery,
  useAddNewPostMutation,
  useEditPostMutation,
  useAddReactionMutation,
  //   useGetUsersQuery,
} = apiSlice
