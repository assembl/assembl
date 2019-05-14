// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { type DocumentNode, graphql, type TVariables } from 'react-apollo';
import { Translate } from 'react-redux-i18n';

import { closeModal, displayModal } from '../../../utils/utilityManager';
import deleteSynthesisMutation from '../../../graphql/mutations/deleteSynthesis.graphql';

import DeletePostIcon from '../../common/icons/deletePostIcon/deletePostIcon';

type RefetchQuery = {
  query: DocumentNode,
  variables: TVariables
};

export type Props = {
  /** Class that is applied to the Link component  */
  linkClassName?: string,
  /** Post identifier */
  synthesisPostId: string,
  /** Array of refetch Queries */
  refetchQueries?: Array<RefetchQuery>,
  /** Modal custom message */
  modalBodyMessage?: string,
  /** callback function handled by the parent component */
  onDeleteCallback?: Function
};

type GraphQLProps = {
  /** Mutation function name issued with deletePostMutation */
  deleteSynthesis: Function
};

type LocalProps = Props & GraphQLProps;

const DeleteSynthesisButton = ({
  deleteSynthesis,
  linkClassName,
  synthesisPostId,
  refetchQueries,
  modalBodyMessage,
  onDeleteCallback
}: LocalProps) => {
  const displayConfirmationModal = () => {
    const title = <Translate value="debate.confirmDeletionTitle" />;
    const body = <Translate value={modalBodyMessage || 'debate.synthesis.confirmDeletionBody'} />;
    const footer = [
      <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="debate.confirmDeletionButtonCancel" />
      </Button>,
      <Button
        key="delete"
        onClick={() => {
          deleteSynthesis({
            refetchQueries: refetchQueries || [],
            variables: { id: synthesisPostId }
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
  };
  return (
    <Button bsClass={linkClassName} onClick={displayConfirmationModal}>
      <DeletePostIcon />
    </Button>
  );
};

DeleteSynthesisButton.defaultProps = {
  deleteSynthesis: null,
  linkClassName: '',
  refetchQueries: [],
  modalBodyMessage: 'debate.confirmDeletionBody',
  onDeleteCallback: null
};

export default graphql(deleteSynthesisMutation, { name: 'deleteSynthesis' })(DeleteSynthesisButton);