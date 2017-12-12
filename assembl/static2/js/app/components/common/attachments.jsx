// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  attachments: ?Array<?AttachmentFragment>
};

const DEFAULT_FILENAME = 'file';

const Attachments = ({ attachments }: Props) => (
  <div className="attachments">
    {attachments &&
      attachments.map((attachment) => {
        if (!attachment || !attachment.document) {
          return null;
        }
        const { externalUrl, mimeType, title } = attachment.document;
        if (mimeType && mimeType.startsWith('image/')) {
          return null;
        }

        return (
          <div className="attachment" key={attachment.id}>
            <span className="assembl-icon-synthesis" />
            <span className="title">{title || externalUrl}</span>
            <a download={title || DEFAULT_FILENAME} href={externalUrl} type={mimeType} target="_blank" rel="noopener noreferrer">
              <Translate value="common.attachments.download" />
            </a>
          </div>
        );
      })}
  </div>
);

export default Attachments;