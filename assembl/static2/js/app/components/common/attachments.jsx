// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

export type Attachment = {
  id: string,
  document: {
    id: string,
    title: string,
    externalUrl: string,
    mimeType?: string
  }
};

type AttachmentsProps = {
  attachments: [Attachment]
};

const Attachments = ({ attachments }: AttachmentsProps) => {
  return (
    <div className="attachments">
      {attachments.map((attachment) => {
        const { externalUrl, title } = attachment.document;
        return (
          <div className="attachment" key={attachment.id}>
            <span className="assembl-icon-synthesis" />
            <span className="title">
              {title || externalUrl}
            </span>
            {/* <span className="mimeType">
              {attachment.mimeType}
            </span> */}
            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
              <Translate value="common.attachments.download" />
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default Attachments;