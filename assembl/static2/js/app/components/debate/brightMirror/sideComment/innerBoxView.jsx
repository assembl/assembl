// @flow
import React from 'react';

import moment from 'moment';
import activeHtml from 'react-active-html';
import { I18n } from 'react-redux-i18n';

import AvatarImage from '../../../common/avatarImage';
import { transformLinksInHtml /* getUrls */ } from '../../../../utils/linkify';
import { postBodyReplacementComponents } from '../../common/post/postBody';

export type Props = {
  contentLocale: string,
  extractIndex: number,
  extracts: Array<FictionExtractFragment>,
  changeCurrentExtract: Function
};

const renderRichtext = text => activeHtml(text && transformLinksInHtml(text), postBodyReplacementComponents());

const InnerBoxView = ({ contentLocale, extractIndex, extracts, changeCurrentExtract }: Props) => {
  const currentExtract = extracts && extracts.length > 0 ? extracts[extractIndex] : null;
  const currentComment = currentExtract && currentExtract.comment;
  const displayName =
    currentComment && currentComment.creator && !currentComment.creator.isDeleted
      ? currentComment.creator.displayName
      : I18n.t('deletedUser');

  return (
    <div>
      <div className="harvesting-box-header">
        <div className="profile">
          <AvatarImage userId={currentComment.creator.userId} userName={displayName} />
          <div className="harvesting-infos">
            <div className="username">{displayName}</div>
            <div className="harvesting-date" title={currentComment.creationDate}>
              {moment(currentComment.creationDate)
                .locale(contentLocale)
                .fromNow()}
            </div>
          </div>
        </div>
      </div>
      <div className="harvesting-box-body">
        <div className="body-container">
          <div className="previous-extract">
            {extracts &&
              extractIndex > 0 && (
                <div
                  onClick={() => {
                    changeCurrentExtract(-1);
                  }}
                >
                  <span className="assembl-icon-down-open grey" />
                </div>
              )}
          </div>
          <div className="extract-body">{currentComment && renderRichtext(currentComment.body)}</div>
          <div className="next-extract">
            {extracts &&
              extractIndex < extracts.length - 1 && (
                <div
                  onClick={() => {
                    changeCurrentExtract(1);
                  }}
                >
                  <span className="assembl-icon-down-open grey" />
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InnerBoxView;