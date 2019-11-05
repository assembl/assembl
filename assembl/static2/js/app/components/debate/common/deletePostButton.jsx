// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { compose, type DocumentNode, graphql, type TVariables } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { withRouter } from 'react-router';

import { closeModal, displayModal } from '../../../utils/utilityManager';
import deletePostMutation from '../../../graphql/mutations/deletePost.graphql';
import HashtagsQuery from '../../../graphql/HashtagsQuery.graphql';
import DeletePostIcon from '../../common/icons/deletePostIcon/deletePostIcon';

type RefetchQuery = {
  query: DocumentNode,
  variables: TVariables
};

export type Props = {
  /** Class that is applied to the Link component  */
  linkClassName?: string,
  /** Post identifier */
  postId: string,
  /** Array of refetch Queries */
  refetchQueries?: Array<RefetchQuery>,
  /** Modal custom message */
  modalBodyMessage?: string,
  /** callback function handled by the parent component */
  onDeleteCallback?: Function,
  /** boolean checking if the post is pending and you are connected as a moderator */
  isPendingForModerator?: boolean
};

type GraphQLProps = {
  /** Mutation function name issued with deletePostMutation */
  deletePost: Function
};

type LocalProps = Props & GraphQLProps;

const DeletePostButton = ({
  deletePost,
  linkClassName,
  postId,
  refetchQueries,
  modalBodyMessage,
  onDeleteCallback,
  isPendingForModerator
}: LocalProps) => {
  const displayConfirmationModal = () => {
    const title = !isPendingForModerator && <Translate value="debate.confirmDeletionTitle" />;
    const body = <Translate value={modalBodyMessage || 'debate.confirmDeletionBody'} />;
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
        <Translate value={isPendingForModerator ? 'debate.confirmRefusalButton' : 'debate.confirmDeletionButtonDelete'} />
      </Button>
    ];
    const includeFooter = true;
    return displayModal(title, body, includeFooter, footer);
  };
  return (
    <Button bsClass={linkClassName} onClick={displayConfirmationModal}>
      {isPendingForModerator ? <span className="assembl-icon-check-box-declined" /> : <DeletePostIcon />}
    </Button>
  );
};

DeletePostButton.defaultProps = {
  deletePost: null,
  linkClassName: '',
  refetchQueries: [],
  modalBodyMessage: 'debate.confirmDeletionBody',
  onDeleteCallback: null
};

export default compose(
  withRouter,
  graphql(deletePostMutation, {
    name: 'deletePost',
    options: (props) => {
      const ideaId = props.questionId
        || props.themeId
        || (props.params
          && (props.params.themeId || props.params.questionId));
      return {
        refetchQueries: [{
          query: HashtagsQuery,
          variables: { ideaId: ideaId }
        }]
      };
    }
  })
)(DeletePostButton);