import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Spinner } from '../../components/Spinner'
import { Link } from 'react-router-dom'
import { PostAuthor } from './PostAuthor'
import { TimeAgo } from './TimeAgo'
import { ReactionButtons } from './ReactionButtons'
import {
  fetchPosts,
  selectAllPosts,
  selectPostIds,
  selectPostById,
} from './postsSlice'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { useGetPostsQuery } from '../api/apiSlice'
import classNames from 'classnames'

/**
 * React's default behavior is that when a parent component renders, React will recursively render all child components inside of it!
 - First, we could wrap the <PostExcerpt> component in React.memo(), which will ensure that the component inside of it only re-renders if the props have actually changed.
 */
// const PostExcerpt = React.memo(({ postId }) => {
//   const post = useSelector((state) => selectPostById(state, postId))
//   return (
//     <article className="post-excerpt">
//       <h3>{post.title}</h3>
//       <div>
//         <PostAuthor userId={post.user} />
//         <TimeAgo timestamp={post.date} />
//       </div>
//       <p className="post-content">{post.content.substring(0, 100)}</p>

//       <ReactionButtons post={post} />
//       <Link to={`/posts/${post.id}`} className="button muted-button">
//         View Post
//       </Link>
//     </article>
//   )
// })

const PostExcerpt = React.memo(({ post }) => {
  return (
    <article className="post-excerpt">
      <h3>{post.title}</h3>
      <div>
        <PostAuthor userId={post.user} />
        <TimeAgo timestamp={post.date} />
      </div>
      <p className="post-content">{post.content.substring(0, 100)}</p>

      <ReactionButtons post={post} />
      <Link to={`/posts/${post.id}`} className="button muted-button">
        View Post
      </Link>
    </article>
  )
})

export const PostsList = () => {
  /**
  if you're using TypeScript, you may need to keep the original object as-is and refer 
  to flags as result.isSuccess in your conditional checks, so that TS can correctly infer that data is valid.
   */
  const {
    data: posts = [], // the actual response contents from the server. This field will be undefined until the response is received.
    isLoading, // a boolean indicating if this hook is currently making the first request to the server
    isFetching, // a boolean indicating if the hook is currently making any request to the server
    isSuccess, // a boolean indicating if the hook has made a successful request and has cached data available
    isError, // if the last request had an error
    error, // serialized error object,
    refetch,
  } = useGetPostsQuery()

  // const dispatch = useDispatch()
  // const orderedPostIds = useSelector(selectPostIds)
  // // const posts = useSelector(selectAllPosts)
  // const postStatus = useSelector((state) => state.posts.status)
  // const error = useSelector((state) => state.posts.error)

  // useEffect(() => {
  //   if (postStatus === 'idle') {
  //     dispatch(fetchPosts())
  //   }
  // }, [postStatus, dispatch])

  // let content

  // if (postStatus === 'loading') {
  //   content = <Spinner text="Loading..." />
  // } else if (postStatus === 'succeeded') {
  //   // Sort posts in reverse chronological order by datetime string
  //   // const orderedPosts = posts
  //   //   .slice()
  //   //   .sort((a, b) => b.date.localeCompare(a.date))

  //   content = orderedPostIds.map((postId) => (
  //     <PostExcerpt key={postId} postId={postId} />
  //   ))
  // } else if (postStatus === 'failed') {
  //   content = <div>{error}</div>
  // }

  const sortedPosts = useMemo(() => {
    const sortedPosts = posts.slice()
    // Sort posts in descending chronological order
    sortedPosts.sort((a, b) => b.date.localeCompare(a.date))
    return sortedPosts
  }, [posts])

  let content
  if (isLoading) {
    content = <Spinner text="Loading..." />
  } else if (isSuccess) {
    const renderedPosts = sortedPosts.map((post) => (
      <PostExcerpt key={post.id} post={post} />
    ))

    const containerClassname = classNames('posts-container', {
      disabled: isFetching,
    })
    content = <div className={containerClassname}>{renderedPosts}</div>
  } else if (isError) {
    content = <div>{error.toString()}</div>
  }

  return (
    <section className="posts-list">
      <h2>Posts</h2>
      <button onClick={refetch}>Refetch Posts</button>
      {content}
    </section>
  )
}
