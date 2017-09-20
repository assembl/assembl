// @flow
import React from 'react';

import type { Attachment } from './attachments';

type EditAttachmentsProps = {
  afterDelete: Function,
  attachments: Array<Attachment>,
  onDelete: Function
};

const EditAttachments = ({ attachments, onDelete, afterDelete }: EditAttachmentsProps) => {
  return (
    <div className="attachments">
      {attachments.map((attachment) => {
        const { externalUrl, title } = attachment.document;
        return (
          <div className="attachment" key={attachment.entityKey}>
            <span className="assembl-icon-text-attachment" />
            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
              {title || externalUrl}
            </a>
            <span
              className="assembl-icon-delete"
              onMouseDown={() => {
                return onDelete(attachment.document.id);
              }}
              onMouseUp={afterDelete}
            />
          </div>
        );
      })}
    </div>
  );
};

export default EditAttachments;