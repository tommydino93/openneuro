import gql from 'graphql-tag'

export const DRAFT_FRAGMENT = gql`
  fragment DatasetDraft on Dataset {
    id
    draft {
      id
      modified
      readme
      partial
      description {
        Name
        Authors
        DatasetDOI
        License
        Acknowledgements
        HowToAcknowledge
        Funding
        ReferencesAndLinks
      }
      files {
        id
        filename
        size
      }
      summary {
        modalities
        sessions
        subjects
        tasks
        size
        totalFiles
      }
    }
  }
`

export const PERMISSION_FRAGMENT = gql`
  fragment DatasetPermissions on Dataset {
    id
    permissions {
      user {
        id
        email
      }
      level
    }
  }
`

export const DATASET_SNAPSHOTS = gql`
  fragment DatasetSnapshots on Dataset {
    id
    snapshots {
      id
      tag
      created
    }
  }
`

const commentsFragmentBuilder = additionalFields => gql`
fragment DatasetComments on Dataset {
  id
  comments {
    id
    text
    createDate
    user {
      email
    }
    ${additionalFields}
  }
}
`

function replies(depth, nestedReplies = null) {
  if (depth > 0) {
    return replies(
      depth - 1,
      `
        replies {
          id
          text
          createDate
          user {
            email
          }
          ${nestedReplies === null ? '' : nestedReplies}
        }
      `,
    )
  } else return nestedReplies
}

// depth of 0 gets just the top level comments
// depth of 1 gets the top level comments and their replies
export const nestedDatasetComments = depth => {
  return commentsFragmentBuilder(replies(depth))
}

export const DATASET_COMMENTS = nestedDatasetComments(2)

export const ISSUE_FIELDS = `
  severity
  code
  reason
  files {
    evidence
    line
    character
    reason
    file {
      name
      path
      relativePath
    }
  }
  additionalFileCount
`

export const DATASET_ISSUES = gql`
  fragment DatasetIssues on Dataset {
    id
    draft {
      id
      issues { 
        ${ISSUE_FIELDS}
      }
    }
  }
`

export const SNAPSHOT_ISSUES = gql`
  fragment SnapshotIssues on Snapshot {
    id
    issues {
      ${ISSUE_FIELDS}
    }
  }
`
