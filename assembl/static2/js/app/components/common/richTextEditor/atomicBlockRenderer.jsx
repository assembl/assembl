import React from 'react';

const AtomicBlockRenderer = ({ block, contentState }) => {
  const entityKey = block.getEntityAt(0);
  const entity = contentState.getEntity(entityKey);
  const data = entity.getData();
  const type = entity.getType();
  if (type === 'document') {
    if (data.mimeType.startsWith('image')) {
      return (
        <figure>
          <img src={data.externalUrl} alt="" title={data.title} width="60%" />
        </figure>
      );
    }
  }

  return <div />;
};

export default AtomicBlockRenderer;