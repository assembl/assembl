// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router';
import { graphql, type DocumentNode, type TVariables } from 'react-apollo';
import { Translate } from 'react-redux-i18n';

import { displayModal, closeModal } from '../../../utils/utilityManager';
import deletePostMutation from '../../../graphql/mutations/deletePost.graphql';

function confirmModal(deletePost, postId, refetchQueries, onDeleteCallback) {
  const title = <Translate value="debate.confirmDeletionTitle" />;
  const body = <Translate value="debate.confirmDeletionBody" />;
  const footer = [
    <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
      <Translate value="debate.confirmDeletionButtonCancel" />
    </Button>,
    <Button
      key="delete"
      onClick={() => {
        deletePost({
          refetchQueries: refetchQueries,
          variables: { postId: postId }
        });
        closeModal();
        if (onDeleteCallback) {
          onDeleteCallback();
        }
      }}
      className="button-submit button-dark"
    >
      <Translate value="debate.confirmDeletionButtonDelete" />
    </Button>
  ];
  const includeFooter = true;
  return displayModal(title, body, includeFooter, footer);
}

type RefetchQuery = {
  query: DocumentNode,
  variables: TVariables
};

export type DeletePostButtonProps = {
  /** Mutation function name issued with deletePostMutation */
  deletePost: Function,
  /** Class that is applied to the Link component  */
  linkClassName?: string,
  /** Post identifier */
  postId: string,
  /** Array of refetch Queries */
  refetchQueries?: Array<RefetchQuery>,
  /** callback function handled by the parent component */
  onDeleteCallback?: Function
};

const DeletePostButton = ({ deletePost, linkClassName, postId, refetchQueries, onDeleteCallback }: DeletePostButtonProps) => (
  <Link className={linkClassName} onClick={() => confirmModal(deletePost, postId, refetchQueries, onDeleteCallback)}>
    <span className="assembl-icon-delete" />
  </Link>
);

DeletePostButton.defaultProps = {
  linkClassName: '',
  refetchQueries: [],
  onDeleteCallback: null
};

export default graphql(deletePostMutation, { name: 'deletePost' })(DeletePostButton);