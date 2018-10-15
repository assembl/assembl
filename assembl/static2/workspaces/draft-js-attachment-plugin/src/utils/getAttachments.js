// @flow
import { type EditorState } from 'draft-js';

export default function (editorState: EditorState) {
  const contentState = editorState.getCurrentContent();
  return contentState
    .getBlockMap()
    .map((block) => {
      if (block.type === 'atomic') {
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const { mimeType, src, title } = entity.getData();
        return {
          blockKey: block.getKey(),
          entityKey: entityKey,
          entityType: entity.getType(),
          mimeType: mimeType,
          src: src,
          title: title
        };
      }

      return null;
    })
    .filter(item => item !== null)
    .toArray();
}