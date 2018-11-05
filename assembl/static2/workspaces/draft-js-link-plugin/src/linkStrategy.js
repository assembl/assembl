// @flow
import type { ContentBlock, ContentState } from 'draft-js';

import { constants } from 'assembl-editor-utils';

export const matchesEntityType = (type: string) => type === constants.ENTITY_TYPES.link;

export default function strategy(contentBlock: ContentBlock, callback: Function, contentState: ContentState) {
  if (!contentState) return;
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return entityKey !== null && matchesEntityType(contentState.getEntity(entityKey).getType());
  }, callback);
}