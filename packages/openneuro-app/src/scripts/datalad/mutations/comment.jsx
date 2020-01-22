import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import { convertToRaw } from 'draft-js'
import withProfile from '../../authentication/withProfile.js'
import { DATASET_COMMENTS } from '../dataset/comments-fragments.js'
import { datasetCacheId } from './cache-id.js'

const NEW_COMMENT = gql`
  mutation addComment($datasetId: ID!, $parentId: ID, $comment: String!) {
    addComment(datasetId: $datasetId, parentId: $parentId, comment: $comment)
  }
`

const EDIT_COMMENT = gql`
  mutation editComment($commentId: ID!, $comment: String!) {
    editComment(commentId: $commentId, comment: $comment)
  }
`

const DELETE_COMMENT = gql`
  mutation deleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId)
  }
`

/**
 * Create a new comment cache entry for Apollo update
 * @param {string} id Comment ID
 * @param {string|null} parentId Parent comment ID if one exists
 * @param {Object} body DraftJS ContentState
 * @param {Object} profile GraphQL User type
 * @param {Object} profile.email User email is the only required property for comments
 * @returns {{id: string, parent: Object, text: string, createDate: string, user: Object, replies: Array, __typename: string }}
 */
export const commentStateFactory = (id, parentId, body, profile) => ({
  id,
  parent: parentId ? { __typename: 'Comment', id: parentId } : null,
  text: JSON.stringify(convertToRaw(body)),
  createDate: new Date().toISOString(),
  user: { __typename: 'User', ...profile },
  replies: [],
  __typename: 'Comment',
})

/**
 * Add a new comment to comment state based on arguments
 * @param {Object[]} comments
 * @param {Object} arguments
 * @param {string} arguments.parentId
 * @param {string} arguments.commentId
 * @param {Object} arguments.comment
 * @param {Object} arguments.profile
 * @returns {Object[]}
 */
export const newCommentsReducer = (
  comments,
  { parentId = null, commentId, comment, profile },
) => {
  console.log('create')
  const newComment = commentStateFactory(commentId, parentId, comment, profile)
  // Must copy with freezeResults enabled
  const nextCommentsState = [...comments, newComment]
  // If this is not a root level comment, add to replies
  if (parentId) {
    const parentIndex = nextCommentsState.findIndex(
      comment => comment.id === parentId,
    )
    const parentReplies = nextCommentsState[parentIndex].replies
    nextCommentsState[parentIndex] = {
      ...comments[parentIndex],
      replies: [...parentReplies, { __typename: 'Comment', id: commentId }],
    }
  }
  return nextCommentsState
}

/**
 * Modify an exsiting comment and return new state based on arguments
 * @param {Object[]} comments
 * @param {Object} arguments
 * @param {string} arguments.commentId
 * @param {Object} arguments.comment
 * @returns {Object[]}
 */
export const modifyCommentsReducer = (comments, { commentId, comment }) => {
  console.log('edit')
  // Must copy with freezeResults enabled
  const nextCommentsState = [...comments]
  const modifiedCommentIndex = nextCommentsState.findIndex(
    c => c.id === commentId,
  )
  const modifiedComment = nextCommentsState[modifiedCommentIndex]
  nextCommentsState[modifiedCommentIndex] = {
    ...modifiedComment,
    text: JSON.stringify(convertToRaw(comment)),
  }
  return nextCommentsState
}

/**
 * Modify an exsiting comment and return new state based on arguments
 * @param {Object[]} comments
 * @param {Object} arguments
 * @param {string} arguments.commentId
 * @returns {Object[]}
 */
export const deleteCommentsReducer = (comments, { commentId }) => {
  console.log('del')
  const nextCommentsState = [...comments]
  const modifiedCommentIndex = nextCommentsState.findIndex(
    c => c.id === commentId,
  )
  nextCommentsState.splice(nextCommentsState[modifiedCommentIndex], 1)
  return nextCommentsState
}

const CommentMutation = ({
  datasetId,
  parentId,
  commentId,
  comment,
  disabled,
  profile,
  deleteMode,
  done = () => {},
}) => {
  return (
    <Mutation
      mutation={
        deleteMode ? DELETE_COMMENT : commentId ? EDIT_COMMENT : NEW_COMMENT
      }
      update={(cache, { data: { addComment } }) => {
        console.log(`Mutation ${deleteMode}`)
        const { comments } = cache.readFragment({
          id: datasetCacheId(datasetId),
          fragment: DATASET_COMMENTS,
        })
        console.log({ addComment })
        // Apply state reduction to cache for new comment changes
        const nextCommentsState = addComment
          ? newCommentsReducer(comments, {
              parentId,
              commentId: addComment,
              comment,
              profile,
            })
          : commentId && deleteMode
          ? deleteCommentsReducer(comments, { commentId })
          : modifyCommentsReducer(comments, { commentId, comment })
        console.log({ nextCommentsState })
        cache.writeFragment({
          id: datasetCacheId(datasetId),
          fragment: DATASET_COMMENTS,
          data: {
            __typename: 'Dataset',
            id: datasetId,
            comments: nextCommentsState,
          },
        })
      }}>
      {newComment => (
        <button
          className="btn-modal-action"
          disabled={disabled}
          onClick={async () => {
            await newComment({
              variables: {
                datasetId,
                parentId,
                commentId,
                comment: JSON.stringify(convertToRaw(comment)),
              },
            })
            done()
          }}>
          Submit Comment
        </button>
      )}
    </Mutation>
  )
}

CommentMutation.propTypes = {
  datasetId: PropTypes.string,
  parentId: PropTypes.string,
  commentId: PropTypes.string,
  comment: PropTypes.object,
  disabled: PropTypes.bool,
  profile: PropTypes.object,
  done: PropTypes.func,
  deleteMode: PropTypes.bool,
}

export default withProfile(CommentMutation)
