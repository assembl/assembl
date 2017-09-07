// @flow
import React from 'react';

import type { Attachment } from './attachments';

type EditAttachmentsProps = {
  attachments: [Attachment],
  onDelete: Function
};

const EditAttachments = ({ attachments, onDelete }: EditAttachmentsProps) => {
  return (
    <div className="attachments">
      {attachments.map((attachment) => {
        const { externalUrl, title } = attachment.document;
        return (
          <div className="attachment" key={attachment.id}>
            <span className="assembl-icon-text-attachment" />
            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
              {title || externalUrl}
            </a>
            <span
              className="assembl-icon-delete"
              onClick={() => {
                return onDelete(attachment.id);
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default EditAttachments;