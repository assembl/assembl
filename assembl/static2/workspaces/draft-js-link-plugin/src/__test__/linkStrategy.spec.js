// @flow
import { ContentState, Modifier } from 'draft-js';

import { constants, createSelectionState } from 'assembl-editor-utils';

import strategy, { matchesEntityType } from '../linkStrategy';

const { ENTITY_MUTABILITY, ENTITY_TYPES } = constants;

describe('matchesEntityType function', () => {
  it('should return true only if type is LINK', () => {
    expect(matchesEntityType(ENTITY_TYPES.link)).toBeTruthy();
    expect(matchesEntityType('WHATEVER')).toBeFalsy();
  });
});

describe('linkStrategy', () => {
  it('should call the callback with start/end offsets for all link entities within a block', () => {
    const callbackSpy = jest.fn();

    let contentState = ContentState.createFromText('I will input the solid state PNG port');
    contentState = contentState.createEntity(ENTITY_TYPES.link, ENTITY_MUTABILITY.mutable, {
      target: '_blank',
      title: 'My link',
      url: 'https://en.wikipedia.org/wiki/Portable_Network_Graphics'
    });
    const contentBlock = contentState.getFirstBlock();
    const blockKey = contentBlock.getKey();
    let selection = createSelectionState(blockKey, 0, 4);
    const linkEntityKey = contentState.getLastCreatedEntityKey();
    contentState = Modifier.applyEntity(contentState, selection, linkEntityKey);
    contentState = contentState.createEntity(ENTITY_TYPES.image, ENTITY_MUTABILITY.mutable, {
      externalUrl: 'my-img.jpg'
    });
    selection = createSelectionState(blockKey, 8, 14);
    const mentionEntityKey = contentState.getLastCreatedEntityKey();
    contentState = Modifier.applyEntity(contentState, selection, mentionEntityKey);

    contentState = contentState.createEntity(ENTITY_TYPES.link, ENTITY_MUTABILITY.mutable, {
      target: '_blank',
      title: 'My link',
      url: 'https://en.wikipedia.org/wiki/Portable_Network_Graphics'
    });
    selection = createSelectionState(blockKey, 12, 16);
    const linkEntityKey2 = contentState.getLastCreatedEntityKey();
    contentState = Modifier.applyEntity(contentState, selection, linkEntityKey2);

    strategy(contentState.getFirstBlock(), callbackSpy, contentState);
    expect(callbackSpy.mock.calls.length).toBe(2);
    expect(callbackSpy.mock.calls[0][0]).toBe(0);
    expect(callbackSpy.mock.calls[0][1]).toBe(4);
    expect(callbackSpy.mock.calls[1][0]).toBe(12);
    expect(callbackSpy.mock.calls[1][1]).toBe(16);
  });
});