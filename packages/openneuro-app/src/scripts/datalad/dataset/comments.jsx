import React, { useState } from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { withApollo } from 'react-apollo'
import Comment from './comment.jsx'
import CommentEditor from '../comments/comment-editor.jsx'
import { nestedDatasetComments } from './dataset-query-fragments'
import LoggedIn from '../../authentication/logged-in.jsx'
import LoggedOut from '../../authentication/logged-out.jsx'
import ErrorBoundary from '../../errors/errorBoundary.jsx'
import { datasetCacheId } from '../mutations/cache-id.js'

const loadMoreComments = (client, datasetId, depth) => {
  const MORE_COMMENT_REPLIES_FRAGMENT = nestedDatasetComments(depth + 1)
  console.log(MORE_COMMENT_REPLIES_FRAGMENT)
  return client
    .query({
      query: gql`
        query dataset($datasetId: ID!) {
          dataset(id: $datasetId) {
            id
            ...DatasetComments
          }
        }
        ${MORE_COMMENT_REPLIES_FRAGMENT}
      `,
      variables: {
        datasetId,
      },
    })
    .then(results => {
      if (
        results.data &&
        results.data.dataset &&
        results.data.dataset.comments
      ) {
        const newComments = results.data.dataset.comments
        const cacheId = datasetCacheId(datasetId)
        const { comments: cachedComments } = client.readFragment({
          id: cacheId,
          fragment: MORE_COMMENT_REPLIES_FRAGMENT,
        })
        console.log({ newComments, cachedComments })
        client.writeFragment({
          id: cacheId,
          fragment: MORE_COMMENT_REPLIES_FRAGMENT,
          data: {
            __typename: 'Dataset',
            id: datasetId,
            comments: newComments,
          },
        })
      }
    })
}

const CommentTree = ({
  datasetId,
  uploader,
  comments,
  client,
  depth,
  maxDepth,
  setMaxDepth,
}) => (
  console.log({
    comments,
    depth,
    maxDepth,
  }),
  (
    <>
      {comments.map(comment => {
        const nextLevel = comment.hasOwnProperty('replies')
          ? comment.replies
          : []
        return (
          <Comment
            key={comment.id}
            datasetId={datasetId}
            uploader={uploader}
            data={comment}>
            {depth <= maxDepth ? (
              <CommentTree
                datasetId={datasetId}
                uploader={uploader}
                comments={nextLevel}
                client={client}
                depth={++depth}
                maxDepth={maxDepth}
                setMaxDepth={setMaxDepth}
              />
            ) : (
              nextLevel.length > 0 && (
                <button
                  onClick={() => {
                    loadMoreComments(client, datasetId, depth).then(() => {
                      console.log(
                        client.cache.readFragment({
                          id: datasetCacheId(datasetId),
                          fragment: nestedDatasetComments(depth + 1),
                        }),
                      )
                      setMaxDepth(prev => prev + 1)
                    })
                  }}>
                  show replies
                </button>
              )
            )}
          </Comment>
        )
      })}
    </>
  )
)

CommentTree.propTypes = {
  datasetId: PropTypes.string,
  uploader: PropTypes.object,
  comments: PropTypes.array,
}

const Comments = ({ datasetId, uploader, comments, client }) => {
  const [maxDepth, setMaxDepth] = useState(1)
  return (
    <div className="col-xs-12">
      <div className="dataset-comments">
        <h2>Comments</h2>
        <ErrorBoundary subject="error in dataset comments">
          <LoggedIn>
            <CommentEditor datasetId={datasetId} />
          </LoggedIn>
          <LoggedOut>
            <div>Please sign in to contribute to the discussion.</div>
          </LoggedOut>
          <CommentTree
            datasetId={datasetId}
            uploader={uploader}
            comments={comments}
            client={client}
            depth={1}
            maxDepth={maxDepth}
            setMaxDepth={setMaxDepth}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}

Comments.propTypes = {
  datasetId: PropTypes.string,
  uploader: PropTypes.object,
  comments: PropTypes.array,
  client: PropTypes.object,
}

export default withApollo(Comments)
