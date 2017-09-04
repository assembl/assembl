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
      {attachments.map((attachment, idx) => {
        return (
          <div className="attachment" key={idx}>
            <span className="assembl-icon-text-attachment" />
            <a href={attachment.externalUrl} target="_blank" rel="noopener noreferrer">
              {attachment.title || attachment.externalUrl}
            </a>
            <span
              className="assembl-icon-delete"
              onClick={() => {
                // TODO: also remove the editorState's entity and atomic block
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