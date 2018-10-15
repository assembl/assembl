// @flow
import { type EntityInstance } from 'draft-js';
import { constants } from 'assembl-editor-utils';

const { ENTITY_TYPES, ENTITY_MUTABILITY } = constants;

export default function (nodeName: string, node: HTMLAnchorElement, createEntity: Function): EntityInstance | null {
  if ((nodeName === 'a' && !node.firstChild) || !(node.firstChild instanceof HTMLImageElement)) {
    const data = {
      url: node.href,
      target: node.target || undefined,
      title: node.title || undefined
    };

    return createEntity(ENTITY_TYPES.link, ENTITY_MUTABILITY.mutable, data);
  }

  return null;
}