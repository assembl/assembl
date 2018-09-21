// @flow
import { type EntityInstance } from 'draft-js';

export default function (nodeName: string, node: HTMLAnchorElement, createEntity: Function): EntityInstance | null {
  if ((nodeName === 'a' && !node.firstChild) || !(node.firstChild instanceof HTMLImageElement)) {
    const data = {
      url: node.href,
      target: node.target || undefined,
      title: node.title || undefined
    };

    return createEntity('LINK', 'MUTABLE', data);
  }

  return null;
}