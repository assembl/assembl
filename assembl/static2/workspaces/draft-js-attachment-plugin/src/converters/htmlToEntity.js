// @flow
import { type EntityInstance } from 'draft-js';

export default (nodeName: string, node: any, createEntity: Function): EntityInstance | null => {
  const defaultImageMimeType = 'image/*';
  const isNotAtomicBlockNode = n => n && (!n.dataset || n.dataset.blocktype !== 'atomic');
  const isLegacyImage =
    nodeName === 'img' && isNotAtomicBlockNode(node.parentNode) && isNotAtomicBlockNode(node.parentNode.parentNode);

  if (isLegacyImage) {
    return createEntity('IMAGE', 'IMMUTABLE', {
      id: node.dataset.id,
      mimeType: node.dataset.mimetype || defaultImageMimeType,
      src: node.src,
      title: node.title || '',
      type: 'IMAGE'
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
    return createEntity('IMAGE', 'IMMUTABLE', {
      id: node.firstChild.dataset.id,
      mimeType: node.firstChild.dataset.mimetype || defaultImageMimeType,
      src: node.firstChild.src,
      title: node.firstChild.title || '',
      type: 'IMAGE'
    });
  } else if (isAtomicBlock) {
    const dataset = (node.firstChild.firstChild && node.firstChild.firstChild.dataset) || {};
    const defaultMimeType = 'application/*';
    return createEntity('DOCUMENT', 'IMMUTABLE', {
      src: dataset.externalurl,
      id: dataset.id,
      title: dataset.title || '',
      type: 'DOCUMENT',
      mimeType: dataset.mimetype || defaultMimeType
    });
  }

  return null;
};