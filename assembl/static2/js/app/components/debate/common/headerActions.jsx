// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { openShareModal } from '../../../utils/utilityManager';

type Props = {
  routerParams: RouterParams,
  ideaId: string,
  useSocialMedia: boolean
};

const headerActions = ({ routerParams, ideaId, useSocialMedia }: Props) => {
  const modalTitle = <Translate value="debate.shareThematic" />;
  return (
    <div className="header-actions-container">
      <div
        className="share-button action-button"
        onClick={() =>
          openShareModal({
            title: modalTitle,
            routerParams: routerParams,
            elementId: ideaId,
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

export default headerActions;