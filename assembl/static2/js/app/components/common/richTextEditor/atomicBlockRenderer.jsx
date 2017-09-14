// @flow
import React from 'react';
import { ContentState } from 'draft-js';
import type { ContentBlock } from 'draft-js';

const AtomicBlockRenderer = ({ block, contentState }: { block: ContentBlock, contentState: ContentState }) => {
  const entityKey = block.getEntityAt(0);
  const entity = contentState.getEntity(entityKey);
  const data = entity.getData();
  const type = entity.getType();
  if (type === 'document') {
    let innerContent = <span className={`attachment-${data.id}`} />;
    if (data.mimeType.startsWith('image')) {
      innerContent = <img src={data.externalUrl} alt="" title={data.title} width="60%" />;
    } else {
      innerContent = (
        <span className="attachment-document">
          {data.title.split('.')[1]}
        </span>
      );
    }

    return (
      <div className="atomic-block" data-blockType="atomic">
        {innerContent}
      </div>
    );
  }

  return <div />;
};

export default AtomicBlockRenderer;