// @flow
/* draft-js plugin for attachment management */
import { convertFromRaw, convertToRaw, Entity, Modifier, RawContentState, SelectionState } from 'draft-js';
import type { ContentBlock } from 'draft-js';
import type { Document } from '../attachments';

const ENTITY_TYPE = 'document';
const BLOCK_TYPE = 'atomic';

type NodeType = Object;

const plugin = {
  blockToHTML: (block: ContentBlock): { start: string, end: string } | null => {
    const type = block.type;
    if (type === 'atomic') {
      return { start: '<div data-blockType="atomic">', end: '</div>' };
    }

    return null;
  },
  entityToHTML: (entity: { data: Document }, originalText: string): string => {
    if (entity.type === ENTITY_TYPE) {
      const { externalUrl, id, title } = entity.data;
      const mimeType = entity.data.mimeType ? entity.data.mimeType : '';
      if (mimeType.startsWith('image')) {
        return `<img src="${externalUrl}" alt="" title="${title}" width="60%" data-id="${id}" data-mimeType="${mimeType}" />`;
      }

      return `<div data-id="${id}" data-mimeType="${mimeType}" data-externalUrl="${externalUrl}" />`;
    }

    return originalText;
  },
  htmlToBlock: (nodeName: string, node: NodeType, lastList: *, inBlock: string): void | string => {
    const isAtomicBlock = nodeName === 'div' && node.dataset.blockType === BLOCK_TYPE;
    if (isAtomicBlock || (nodeName === 'img' && inBlock !== BLOCK_TYPE)) {
      return BLOCK_TYPE;
    }

    return undefined;
  },
  htmlToEntity: (nodeName: string, node: NodeType): Entity | void => {
    let defaultMimeType;
    let externalUrl;
    const isAtomicBlock = nodeName === 'div' && node.dataset && node.dataset.blockType === BLOCK_TYPE;
    const isImage = (isAtomicBlock && node.firstChild.nodeName === 'IMG') || nodeName === 'img';
    if (isImage) {
      defaultMimeType = 'image/*';
      externalUrl = node.src;
    } else if (isAtomicBlock) {
      defaultMimeType = 'application/*';
      externalUrl = node.dataset.externalUrl;
    }

    if (isAtomicBlock || isImage) {
      return Entity.create(ENTITY_TYPE, 'IMMUTABLE', {
        externalUrl: externalUrl,
        id: node.dataset.id,
        title: node.title || '',
        type: 'document',
        mimeType: node.dataset.mimeType || defaultMimeType
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
  },
  removeAttachment: (rawContentState: RawContentState, documentId: string): RawContentState => {
    let contentState = convertFromRaw(rawContentState);
    let targetBlock = null;
    contentState.getBlockMap().forEach((block) => {
      block.findEntityRanges((entityRange) => {
        const entityKey = entityRange.entity;
        if (entityKey) {
          const entity = contentState.getEntity(entityKey);
          if (entity && entity.data.id && entity.data.id === documentId) {
            targetBlock = block;
          }
        }
      });
    });

    if (targetBlock) {
      const targetRange = new SelectionState({
        anchorKey: targetBlock.key,
        anchorOffset: 0,
        focusKey: targetBlock.key,
        focusOffset: 1
      });

      contentState = Modifier.removeRange(contentState, targetRange, 'backward');
      contentState = Modifier.setBlockType(contentState, targetRange, 'unstyled');
      return convertToRaw(contentState);
    }

    return rawContentState;
  }
};

export default plugin;