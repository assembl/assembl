// @flow
/* draft-js plugin for attachment management */
import { convertFromRaw, convertToRaw, Entity, Modifier, RawContentState, SelectionState } from 'draft-js';
import type { ContentBlock, ContentState } from 'draft-js';
import type { Attachment, Document } from '../attachments';
import { getExtension, getIconPath } from '../documentExtensionIcon';

const ENTITY_TYPE = 'document';
const BLOCK_TYPE = 'atomic';

type NodeType = Object;

const plugin = {
  blockToHTML: (block: ContentBlock): { start: string, end: string } | void => {
    const type = block.type;
    if (type === 'atomic') {
      return { start: '<div class="atomic-block" data-blocktype="atomic">', end: '</div>' };
    }

    return undefined;
  },
  entityToHTML: (entity: { data: Document }, originalText: string): string => {
    if (entity.type === ENTITY_TYPE) {
      const { externalUrl, id } = entity.data;
      const mimeType = entity.data.mimeType ? entity.data.mimeType : '';
      const title = entity.data.title ? entity.data.title : '';
      if (mimeType.startsWith('image')) {
        return `<img src="${externalUrl}" alt="" title="${title}" width="60%" data-id="${id}" data-mimetype="${mimeType}" />`;
      }

      const extension = getExtension(title);
      const iconPath = getIconPath(extension);
      return (
        `<img alt="${extension}" src="${iconPath}" width="30px" data-id="${id}" data-mimetype="${mimeType}"` +
        ` data-title="${title}" data-externalurl="${externalUrl}" />`
      );
    }

    return originalText;
  },
  htmlToBlock: (nodeName: string, node: NodeType, lastList: *, inBlock: string): void | string => {
    const isAtomicBlock = nodeName === 'div' && node.dataset.blocktype === BLOCK_TYPE;
    if (isAtomicBlock || (nodeName === 'img' && inBlock !== BLOCK_TYPE)) {
      return BLOCK_TYPE;
    }

    return undefined;
  },
  htmlToEntity: (nodeName: string, node: NodeType, createEntity: Function): Entity | void => {
    const defaultImageMimeType = 'image/*';
    const isLegacyImage =
      nodeName === 'img' && (node.parentNode && node.parentNode.dataset && node.parentNode.dataset.blocktype !== BLOCK_TYPE);
    if (isLegacyImage) {
      return createEntity(ENTITY_TYPE, 'IMMUTABLE', {
        externalUrl: node.src,
        id: node.dataset.id,
        title: node.title || '',
        type: 'document',
        mimeType: node.dataset.mimetype || defaultImageMimeType
      });
    }

    const isAtomicBlock = nodeName === 'div' && node.dataset && node.dataset.blocktype === BLOCK_TYPE;
    const isImage =
      isAtomicBlock &&
      node.firstChild &&
      node.firstChild.dataset.mimetype &&
      node.firstChild.dataset.mimetype.startsWith('image');
    if (isImage) {
      return createEntity(ENTITY_TYPE, 'IMMUTABLE', {
        externalUrl: node.firstChild.src,
        id: node.firstChild.dataset.id,
        title: node.firstChild.title || '',
        type: 'document',
        mimeType: node.firstChild.dataset.mimetype || defaultImageMimeType
      });
    } else if (isAtomicBlock) {
      const defaultMimeType = 'application/*';
      return createEntity(ENTITY_TYPE, 'IMMUTABLE', {
        externalUrl: node.firstChild.dataset.externalurl,
        id: node.firstChild.dataset.id,
        title: node.firstChild.dataset.title || '',
        type: 'document',
        mimeType: node.firstChild.dataset.mimetype || defaultMimeType
      });
    }

    return undefined;
  },

  getAttachments: (rawContentState: RawContentState): Array<Attachment> => {
    if (!rawContentState) {
      return [];
    }

    const contentState = convertFromRaw(rawContentState);
    const attachments = [];
    contentState.getBlockMap().forEach((block) => {
      if (block.type === 'atomic') {
        block.findEntityRanges((entityRange) => {
          const entityKey = entityRange.entity;
          if (entityKey) {
            const entity = contentState.getEntity(entityKey);
            if ((entity && entity.data.id) || entity.data.file) {
              let doc;
              if (entity.data.file) {
                doc = {
                  id: entity.data.file.name,
                  externalUrl: '',
                  title: entity.data.file.name
                };
              } else {
                doc = entity.data;
              }
              const attachment = {
                entityKey: entityKey,
                document: doc
              };
              attachments.push(attachment);
            }
          }
        });
      }
    });

    return attachments;
  },
  getAttachmentsDocumentIds: (rawContentState: RawContentState): Array<String> => {
    const contentState = convertFromRaw(rawContentState);
    const attachments = [];
    contentState.getBlockMap().forEach((block) => {
      if (block.type === 'atomic') {
        block.findEntityRanges((entityRange) => {
          const entityKey = entityRange.entity;
          if (entityKey) {
            const entity = contentState.getEntity(entityKey);
            if (entity && entity.data.id) {
              attachments.push(entity.data.id);
            }
          }
        });
      }
    });
    return attachments;
  },
  removeAttachment: (contentState: ContentState, documentId: string): ContentState => {
    let targetBlock = null;
    contentState.getBlockMap().forEach((block) => {
      block.findEntityRanges((entityRange) => {
        const entityKey = entityRange.entity;
        if (entityKey) {
          const entity = contentState.getEntity(entityKey);
          if (entity) {
            const entityDocId = entity.data.id ? entity.data.id : entity.data.file.name;
            if (entityDocId === documentId) {
              targetBlock = block;
            }
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

      let newContentState = Modifier.applyEntity(contentState, targetRange, null);
      const nextBlock = newContentState.getBlockAfter(targetBlock.key);
      const previousBlock = newContentState.getBlockBefore(targetBlock.key);
      newContentState = newContentState.set('blockMap', newContentState.get('blockMap').delete(targetBlock.key));

      // also remove next block if it is empty and unstyled
      if (nextBlock.getType() === 'unstyled' && !nextBlock.getLength()) {
        newContentState = newContentState.set('blockMap', newContentState.get('blockMap').delete(nextBlock.getKey()));
      }

      // if the previous block is not the last block, remove it too
      if (newContentState.getBlocksAsArray().length > 1 && previousBlock.getType() === 'unstyled' && !previousBlock.getLength()) {
        newContentState = newContentState.set('blockMap', newContentState.get('blockMap').delete(previousBlock.getKey()));
      }

      return newContentState;
    }

    return contentState;
  },

  uploadNewAttachments: (rawContentState: RawContentState, uploadDocument: Function): Promise<*> => {
    if (!rawContentState) {
      return new Promise((resolve) => {
        resolve({ contentState: null, documentIds: [] });
      });
    }

    const documentIds = [];
    let contentState = convertFromRaw(rawContentState);
    const entities = [];
    contentState.getBlockMap().forEach((block) => {
      if (block.type === 'atomic') {
        block.findEntityRanges((entityRange) => {
          const entityKey = entityRange.entity;
          if (entityKey) {
            const entity = contentState.getEntity(entityKey);
            if (entity) {
              entities.push({
                entityKey: entityKey,
                entity: entity
              });
            }
          }
        });
      }
    });

    let uploadDocumentsPromise = Promise.resolve();
    entities.forEach((entityInfo) => {
      const { entity, entityKey } = entityInfo;
      if (entity.data.file) {
        // this is a new document, add a promise to create it and modify its entity
        const variables = {
          file: entity.data.file
        };
        uploadDocumentsPromise = uploadDocumentsPromise.then(() =>
          uploadDocument({ variables: variables }).then((res) => {
            if (res && res.data) {
              const doc = res.data.uploadDocument.document;
              documentIds.push(doc.id);
              // update entity
              const { externalUrl, id, mimeType, title } = doc;
              contentState = contentState.replaceEntityData(entityKey, {
                id: id,
                externalUrl: externalUrl,
                title: title,
                mimeType: mimeType
              });
            }
          })
        );
      } else {
        documentIds.push(entity.data.id);
      }
    });

    return uploadDocumentsPromise.then(
      () =>
        new Promise((resolve) => {
          resolve({
            contentState: convertToRaw(contentState),
            documentIds: documentIds
          });
        })
    );
  }
};

export type UploadNewAttachmentsPromiseResult = {
  contentState: RawContentState,
  documentIds: Array<string>
};

export default plugin;