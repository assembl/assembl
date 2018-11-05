// @flow
import { type EntityInstance } from 'draft-js';
import { constants } from 'assembl-editor-utils';

const { ENTITY_TYPES, ENTITY_MUTABILITY } = constants;

export default (nodeName: string, node: any, createEntity: Function): EntityInstance | null => {
  const defaultImageMimeType = 'image/*';
  const isNotAtomicBlockNode = n => n && (!n.dataset || n.dataset.blocktype !== 'atomic');
  const isLegacyImage =
    nodeName === 'img' && isNotAtomicBlockNode(node.parentNode) && isNotAtomicBlockNode(node.parentNode.parentNode);

  if (isLegacyImage) {
    return createEntity(ENTITY_TYPES.image, ENTITY_MUTABILITY.immutable, {
      id: node.dataset.id,
      mimeType: node.dataset.mimetype || defaultImageMimeType,
      src: node.src,
      title: node.title || '',
      type: ENTITY_TYPES.image
    });
  }

  const isAtomicBlock = nodeName === 'div' && node.dataset && node.dataset.blocktype === 'atomic';
  const isImage =
    isAtomicBlock &&
    node.firstChild &&
    node.firstChild.dataset &&
    node.firstChild.dataset.mimetype &&
    node.firstChild.dataset.mimetype.startsWith('image');
  if (isImage) {
    return createEntity(ENTITY_TYPES.image, ENTITY_MUTABILITY.immutable, {
      id: node.firstChild.dataset.id,
      mimeType: node.firstChild.dataset.mimetype || defaultImageMimeType,
      src: node.firstChild.src,
      title: node.firstChild.title || '',
      type: ENTITY_TYPES.image
    });
  } else if (isAtomicBlock) {
    const dataset = (node.firstChild.firstChild && node.firstChild.firstChild.dataset) || {};
    const defaultMimeType = 'application/*';
    return createEntity(ENTITY_TYPES.document, ENTITY_MUTABILITY.immutable, {
      src: dataset.externalurl,
      id: dataset.id,
      title: dataset.title || '',
      type: ENTITY_TYPES.document,
      mimeType: dataset.mimetype || defaultMimeType
    });
  }

  return null;
};