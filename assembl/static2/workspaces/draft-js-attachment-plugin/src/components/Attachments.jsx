// @flow
import * as React from 'react';

import { type Store } from '../index';
import getAttachments from '../utils/getAttachments';

type Props = {
  removeAttachment: (EditorState, string) => EditorState,
  store: Store
};

const Attachments = ({ removeAttachment, store }: Props) => {
  const { getEditorState, setEditorState } = store;
  if (getEditorState && setEditorState) {
    const editorState = getEditorState();
    return (
      <div className="attachments">
        {editorState &&
          getAttachments(editorState).map((attachment) => {
            const { blockKey, entityKey, src, title } = attachment;
            const href = src instanceof File ? URL.createObjectURL(src) : src;
            return (
              <div className="attachment" key={entityKey}>
                <span className="assembl-icon-text-attachment" />
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {title || href}
                </a>
                <span
                  className="assembl-icon-delete"
                  onClick={() => {
                    setEditorState(removeAttachment(editorState, blockKey));
                  }}
                />
              </div>
            );
          })}
      </div>
    );
  }

  return null;
};

export default Attachments;