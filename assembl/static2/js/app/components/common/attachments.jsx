// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

export type Attachment = {
  id: string,
  title: string,
  externalUrl: string,
  mimeType?: string
};

type AttachmentsProps = {
  attachments: [Attachment]
};

const Attachments = ({ attachments }: AttachmentsProps) => {
  return (
    <div className="attachments">
      {attachments.map((attachment, idx) => {
        return (
          <div className="attachment" key={idx}>
            <span className="assembl-icon-synthesis" />
            <span className="title">
              {attachment.title || attachment.externalUrl}
            </span>
            {/* <span className="mimeType">
              {attachment.mimeType}
            </span> */}
            <a href={attachment.externalUrl} target="_blank" rel="noopener noreferrer">
              <Translate value="common.attachments.download" />
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default Attachments;