// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router';
import { graphql, type DocumentNode, type TVariables } from 'react-apollo';
import { Translate } from 'react-redux-i18n';

import { displayModal, closeModal } from '../../../utils/utilityManager';
import deletePostMutation from '../../../graphql/mutations/deletePost.graphql';

function confirmModal(deletePost, postId, refetchQueries) {
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

type Props = {
  deletePost: Function,
  linkClassName: ?string,
  postId: string,
  refetchQueries: Array<RefetchQuery>
};

const DeletePostButton = ({ deletePost, linkClassName, postId, refetchQueries }: Props) => (
  <Link className={linkClassName} onClick={() => confirmModal(deletePost, postId, refetchQueries)}>
    <span className="assembl-icon-delete" />
  </Link>
);

DeletePostButton.defaultProps = {
  refetchQueries: []
};

export default graphql(deletePostMutation, { name: 'deletePost' })(DeletePostButton);