// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { graphql, type DocumentNode, type TVariables } from 'react-apollo';
import { I18n } from 'react-redux-i18n';
import { displayAlert } from '../../../utils/utilityManager';

import validatePostMutation from '../../../graphql/mutations/validatePost.graphql';

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
  refetchQueries?: Array<RefetchQuery>
};

type GraphQLProps = {
  /** Mutation function name issued with deletePostMutation */
  validatePost: Function
};

type LocalProps = Props & GraphQLProps;

const ValidatePostButton = ({ validatePost, linkClassName, postId, refetchQueries }: LocalProps) => {
  const handleValidation = () => {
    validatePost({
      variables: {
        postId: postId
      },
      optimisticResponse: {
        validatePost: {
          post: {
            id: postId,
            publicationState: 'PUBLISHED',
            __typename: 'Post'
          },
          __typename: 'ValidatePost'
        }
      },
      refetchQueries: refetchQueries
    })
      .then(() => {
        displayAlert('success', I18n.t('debate.validateSuccess'));
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };
  return (
    <Button bsClass={linkClassName} onClick={handleValidation}>
      <span className="assembl-icon-check" />
    </Button>
  );
};

ValidatePostButton.defaultProps = {
  validatePost: null,
  linkClassName: '',
  refetchQueries: []
};

export default graphql(validatePostMutation, { name: 'validatePost' })(ValidatePostButton);