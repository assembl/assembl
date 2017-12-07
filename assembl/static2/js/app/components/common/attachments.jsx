// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

export type Document = {
  id: string,
  title?: string,
  externalUrl: string,
  mimeType?: string,
  file?: File
};

export type Attachment = {
  entityKey: string,
  id?: string,
  document: Document
};

type AttachmentsProps = {
  attachments: Array<Attachment>
};

const DEFAULT_FILENAME = 'file';

const Attachments = ({ attachments }: AttachmentsProps) => (
  <div className="attachments">
    {attachments.map((attachment) => {
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