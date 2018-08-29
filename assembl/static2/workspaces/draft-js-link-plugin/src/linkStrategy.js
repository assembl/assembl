// @flow
import type { ContentBlock, ContentState } from 'draft-js';

export const matchesEntityType = (type: string) => type === 'LINK';

export default function strategy(contentBlock: ContentBlock, callback: Function, contentState: ContentState) {
  if (!contentState) return;
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return entityKey !== null && matchesEntityType(contentState.getEntity(entityKey).getType());
  }, callback);
}