// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
// Utils imports
import { openShareModal } from '../../../utils/utilityManager';
// Type imports
import type { BrightMirrorFictionProps } from '../../../pages/brightMirrorFiction';

export type Props = {
  /** Meta information such as slug, phase, themeId, fictionId required by openShareModal > getPathForModal in utilityManager */
  metaInfo: BrightMirrorFictionProps,
  /** Classname is the component needs to be styled */
  linkClassName: ?string,
  /** Sharing modal popup title */
  modalTitleMsgKey: string,
  /** Type that defines how to build the URL to share with getPathForModal in utilityManager, check routes.json for the URL format */
  type: string
};

const SharePostButton = ({ metaInfo, linkClassName, modalTitleMsgKey, type }: Props) => {
  const titleComponent = <Translate value={modalTitleMsgKey} />;
  const openShareModalParams = {
    routerParams: metaInfo,
    title: titleComponent,
    type: type
  };

  return (
    <Link className={linkClassName} onClick={() => openShareModal(openShareModalParams)}>
      <span className="assembl-icon-share" />
    </Link>
  );
};

export default SharePostButton;