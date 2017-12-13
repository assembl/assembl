// @flow
import React from 'react';

export type Attachment = {
  entityKey: string,
  document: EditableDocument
};

type EditAttachmentsProps = {
  attachments: Array<Attachment>,
  onDelete: Function
};

const EditAttachments = ({ attachments, onDelete }: EditAttachmentsProps) => (
  <div className="attachments">
    {attachments.map((attachment) => {
      const { externalUrl, title } = attachment.document;
      return (
        <div className="attachment" key={attachment.entityKey}>
          <span className="assembl-icon-text-attachment" />
          <a href={externalUrl} target="_blank" rel="noopener noreferrer">
            {title || externalUrl}
          </a>
          <span className="assembl-icon-delete" onMouseDown={() => onDelete(attachment.document.id)} />
        </div>
      );
    })}
  </div>
);

export default EditAttachments;