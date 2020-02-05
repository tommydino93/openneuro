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
 * Modify an existing comment and return new state based on arguments
 * @param {Object[]} comments
 * @param {Object} arguments
 * @param {string} arguments.commentId
 * @param {Object} arguments.comment
 * @returns {Object[]}
 */
export const modifyCommentsReducer = (comments, { commentId, comment }) => {
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

export const deleteCommentsReducer = (comments, { commentId }) => {
  console.log('comments', { comments, commentId })
  let indices = []
  // comments array copy
  let nextCommentsState = [...comments]
  // find the comment to delete in comments array
  let deletedCommentIndex = nextCommentsState.findIndex(c => c.id === commentId)
  // push index of comment to delete
  indices.push(deletedCommentIndex)
  // if deleted comment has replies
  if (nextCommentsState[deletedCommentIndex].replies.length !== 0) {
    console.error('has replies')
  }
  // if deleted comment has parent
  else if (nextCommentsState[deletedCommentIndex].parent !== null) {
    // parent comment id
    let parentId = nextCommentsState[deletedCommentIndex].parent.id
    // where in comments is the parent comment ?
    const parentCommentIndex = nextCommentsState.findIndex(
      c => c.id === parentId,
    )
    // where in the parent comment is the deleted comment listed as a reply ?
    let deletedReplyIndex = nextCommentsState[
      parentCommentIndex
    ].replies.findIndex(c => c.id === commentId)
    // remove reply
    let parentComment = nextCommentsState[parentCommentIndex]
    let replies = [...parentComment.replies]
    replies.splice(deletedReplyIndex, 1)
    parentComment.replies = [...replies]
    console.log(parentComment.replies)
    nextCommentsState[parentCommentIndex] = parentComment
    console.log(nextCommentsState[parentCommentIndex])
    console.log('post-replies', nextCommentsState[parentCommentIndex].replies)
  }
  console.log('before end', { nextCommentsState })
  nextCommentsState.splice(deletedCommentIndex, 1)
  console.log('at end', nextCommentsState)
  return nextCommentsState
}

const CommentMutation = ({
  datasetId,
  parentId,
  commentId,
  comment,
  disabled,
  profile,
  done = () => {},
}) => {
  return (
    <Mutation
      mutation={commentId ? EDIT_COMMENT : NEW_COMMENT}
      update={(cache, { data: { addComment } }) => {
        const { comments } = cache.readFragment({
          id: datasetCacheId(datasetId),
          fragment: DATASET_COMMENTS,
        })
        // Apply state reduction to cache for new comment changes
        const nextCommentsState = addComment
          ? newCommentsReducer(comments, {
              parentId,
              commentId: addComment,
              comment,
              profile,
            })
          : modifyCommentsReducer(comments, { commentId, comment })
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
}

export default withProfile(CommentMutation)
