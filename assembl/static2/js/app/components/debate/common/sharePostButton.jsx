// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
// Utils imports
import { openShareModal } from '../../../utils/utilityManager';

export type Props = {
  /** Meta information such as slug, phase, themeId, fictionId required by openShareModal > getPathForModal in utilityManager */
  routerParams: RouterParams,
  /** Classname is the component needs to be styled */
  linkClassName: string,
  /** Sharing modal popup title */
  modalTitleMsgKey: string,
  /** Type that defines how to build the URL to share with getPathForModal
   in utilityManager, check routes.json for the URL format */
  type: string,
  postId?: ?string
};

const SharePostButton = ({ routerParams, linkClassName, modalTitleMsgKey, type, postId }: Props) => {
  const titleComponent = <Translate value={modalTitleMsgKey} />;
  const openShareModalParams = {
    routerParams: routerParams,
    title: titleComponent,
    type: type,
    postId: postId
  };

  return (
    <Link className={linkClassName} onClick={() => openShareModal(openShareModalParams)}>
      <span className="assembl-icon-share" />
    </Link>
  );
};
SharePostButton.defaultProps = {
  postId: null
};
export default SharePostButton;