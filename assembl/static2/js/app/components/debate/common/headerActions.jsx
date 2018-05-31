// @flow
import * as React from 'react';
import { withRouter } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { openShareModal } from '../../../utils/utilityManager';

type Props = {
  params: RouterParams,
  type: string,
  useSocialMedia: boolean
};

const headerActions = ({ type, params, useSocialMedia }: Props) => {
  const modalTitle = <Translate value="debate.shareThematic" />;
  return (
    <div className="header-actions-container">
      <div
        className="share-button action-button"
        onClick={() =>
          openShareModal({
            type: type,
            title: modalTitle,
            routerParams: params,
            social: useSocialMedia
          })
        }
      >
        <div className="share-icon-container white">
          <span className="assembl-icon-share" />
        </div>
        <div className="action-button-label">
          <Translate value="debate.share" />
        </div>
      </div>
    </div>
  );
};

export default withRouter(headerActions);