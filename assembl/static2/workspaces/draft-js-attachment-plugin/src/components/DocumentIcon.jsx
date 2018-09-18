// @flow
import * as React from 'react';
import { ContentState } from 'draft-js';
import type { ContentBlock } from 'draft-js';

import getDocumentIconPath from '../utils/getDocumentIconPath';
import getFileExtension from '../utils/getFileExtension';

const DocumentIcon = ({ block, contentState }: { block: ContentBlock, contentState: ContentState }) => {
  const entityKey = block.getEntityAt(0);
  const entity = contentState.getEntity(entityKey);
  const data = entity.getData();
  const type = entity.getType();
  if (type === 'DOCUMENT') {
    const extension = getFileExtension(data.title);
    const iconPath = getDocumentIconPath(extension);
    return (
      <div className="atomic-block" data-blocktype="atomic" title={data.title}>
        <img className="attachment-icon" src={iconPath} alt={extension} />
      </div>
    );
  }

  return <div />;
};

export default DocumentIcon;