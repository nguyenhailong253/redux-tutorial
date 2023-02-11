import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { selectUserById } from '../users/usersSlice'
import { selectAllPosts, selectPostsByUser } from '../posts/postsSlice'
import { createSelector } from '@reduxjs/toolkit'
import { useGetPostsQuery } from '../api/apiSlice'

export const UserPage = ({ match }) => {
  const { userId } = match.params

  const user = useSelector((state) => selectUserById(state, userId))

  // use useMemo when only some specific components need to transform the cached data
  const selectPostsForUser = useMemo(() => {
    const emptyArray = []
    // Return a unique selector instance for this page so that
    // the filtered results are correctly memoized
    return createSelector(
      (res) => res.data, // data from the server
      (res, userId) => userId,
      (data, userId) =>
        data?.filter((post) => post.user === userId) ?? emptyArray
    )
  }, [])

  // Memoizing Selector Functions
  // const postsForUser = useSelector((state) => selectPostsByUser(state, userId))

  // Use the same posts query, but extract only part of its data
  const { postsForUser } = useGetPostsQuery(undefined, {
    // in this case we're only dealing with the "result" value that is kept in the cache.
    // The result object has a data field inside with the actual values we need, as well as some of the request metadata fields.
    selectFromResult: (result) => ({
      // We can optionally include the other metadata fields from the result here
      ...result,
      // Include a field called `postsForUser` in the hook result object,
      // which will be a filtered list of posts
      postsForUser: selectPostsForUser(result, userId), // Since result is being kept in the Redux store, we can't mutate it - we need to return a new object
    }),
  })

  const postTitles = postsForUser.map((post) => (
    <li key={post.id}>
      <Link to={`/posts/${post.id}`}>{post.title}</Link>
    </li>
  ))

  return (
    <section>
      <h2>{user.name}</h2>

      <ul>{postTitles}</ul>
    </section>
  )
}
