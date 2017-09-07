// @flow
/* draft-js plugin for attachment management */
import { convertFromRaw, Entity, RawContentState } from 'draft-js';
import type { Attachment } from '../attachments';

const ENTITY_TYPE = 'document';
const BLOCK_TYPE = 'atomic';

type BlockType = { type: string };
type NodeType = Object;

const plugin = {
  blockToHTML: (block: BlockType): { start: string, end: string } | null => {
    const type = block.type;
    if (type === 'atomic') {
      return { start: '<figure>', end: '</figure>' };
    }

    return null;
  },
  entityToHTML: (entity: { data: Attachment }, originalText: string): string => {
    if (entity.type === ENTITY_TYPE) {
      const { externalUrl, id, mimeType, title } = entity.data;
      if (mimeType && mimeType.startsWith('image')) {
        return `<img src="${externalUrl}" alt="" title="${title}" width="60%" data-id="${id}" />`;
      }
    }

    return originalText;
  },
  htmlToBlock: (nodeName: string, node: NodeType, lastList: *, inBlock: string): void | string => {
    if ((nodeName === 'figure' && node.firstChild.nodeName === 'IMG') || (nodeName === 'img' && inBlock !== BLOCK_TYPE)) {
      return BLOCK_TYPE;
    }

    return undefined;
  },
  htmlToEntity: (nodeName: string, node: NodeType): Entity | void => {
    if ((nodeName === 'figure' && node.firstChild.nodeName === 'IMG') || nodeName === 'img') {
      return Entity.create(ENTITY_TYPE, 'IMMUTABLE', {
        externalUrl: node.src,
        id: node.dataset.id,
        title: node.title,
        type: 'document',
        mimeType: 'image/type'
      });
    }

    return undefined;
  },
  getAttachments: (rawContentState: RawContentState): Array<String> => {
    const contentState = convertFromRaw(rawContentState);
    const attachments = [];
    contentState.getBlockMap().forEach((block) => {
      block.findEntityRanges((entityRange) => {
        const entityKey = entityRange.entity;
        if (entityKey) {
          const entity = contentState.getEntity(entityKey);
          if (entity && entity.data.id) {
            attachments.push(entity.data.id);
          }
        }
      });
    });
    return attachments;
  }
};

export default plugin;