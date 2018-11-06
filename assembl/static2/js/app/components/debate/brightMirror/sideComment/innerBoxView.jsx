// @flow
import React, { Fragment } from 'react';

import moment from 'moment';
import activeHtml from 'react-active-html';
import { I18n } from 'react-redux-i18n';

import AvatarImage from '../../../common/avatarImage';
import { transformLinksInHtml /* getUrls */ } from '../../../../utils/linkify';
import { postBodyReplacementComponents } from '../../common/post/postBody';

export type Props = {
  contentLocale: string,
  extractIndex: number,
  extracts: ?Array<FictionExtractFragment>,
  comment: ExtractComment,
  changeCurrentExtract: (?number) => void
};

const renderRichtext = (text: string) => activeHtml(text && transformLinksInHtml(text), postBodyReplacementComponents());

const InnerBoxView = ({ contentLocale, extractIndex, extracts, comment, changeCurrentExtract }: Props) => {
  const displayName =
    comment && comment.creator && !comment.creator.isDeleted ? comment.creator.displayName : I18n.t('deletedUser');

  return (
    <Fragment>
      <div className="harvesting-box-header">
        <div className="profile">
          <AvatarImage userId={comment.creator.userId} userName={displayName} />
          <div className="harvesting-infos">
            <div className="username">{displayName}</div>
            <div className="harvesting-date" title={comment.creationDate}>
              {moment(comment.creationDate)
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
          <div className="extract-body">{comment && renderRichtext(comment.body)}</div>
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
    </Fragment>
  );
};

export default InnerBoxView;