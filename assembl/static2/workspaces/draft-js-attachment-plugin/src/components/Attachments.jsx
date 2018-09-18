// @flow
import * as React from 'react';

import { type Store } from '../index';
import getAttachments from '../utils/getAttachments';

type Props = {
  removeAttachment: any => void,
  store: Store
};

const Attachments = ({ removeAttachment, store }: Props) => (
  <div className="attachments">
    {store.getEditorState &&
      getAttachments(store.getEditorState()).map((attachment) => {
        const { entityKey, src, title } = attachment;
        const href = src instanceof File ? URL.createObjectURL(src) : src;
        return (
          <div className="attachment" key={entityKey}>
            <span className="assembl-icon-text-attachment" />
            <a href={href} target="_blank" rel="noopener noreferrer">
              {title || href}
            </a>
            <span className="assembl-icon-delete" onClick={() => removeAttachment(attachment)} />
          </div>
        );
      })}
  </div>
);

export default Attachments;