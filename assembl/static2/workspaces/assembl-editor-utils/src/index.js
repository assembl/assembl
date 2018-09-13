// @flow
import { EditorState, Modifier, RichUtils } from 'draft-js';
import DraftJSPluginsUtils from 'draft-js-plugins-utils';

import { getSelectedBlockKey } from './blocks';
import { getEntityRange } from './entities';
import { createSelectionState } from './selection';

type LinkData = {
  target: ?string,
  text: ?string,
  title: ?string,
  url: string
};

const { collapseToEnd, getCurrentEntity, getCurrentEntityKey, hasEntity, removeLinkAtSelection } = DraftJSPluginsUtils;

export default {
  collapseToEnd: collapseToEnd,

  createLinkAtSelection: (editorState: EditorState, data: LinkData): EditorState => {
    const { text } = data;
    const contentState = editorState.getCurrentContent().createEntity('LINK', 'MUTABLE', data);
    const entityKey = contentState.getLastCreatedEntityKey();
    let withLink;
    if (text) {
      const newContentState = Modifier.replaceText(contentState, editorState.getSelection(), text, undefined, entityKey);
      withLink = EditorState.createWithContent(newContentState);
    } else {
      withLink = RichUtils.toggleLink(editorState, editorState.getSelection(), entityKey);
    }
    return EditorState.forceSelection(withLink, editorState.getSelection());
  },

  replaceLinkAtCursor: (editorState: EditorState, data: LinkData): EditorState => {
    const { text } = data;
    const contentState = editorState.getCurrentContent();
    const blockKey = getSelectedBlockKey(editorState);
    const replacedEntityKey = getCurrentEntityKey(editorState);
    if (replacedEntityKey) {
      const entityRange = getEntityRange(editorState, replacedEntityKey);
      if (text && entityRange) {
        const { start, end } = entityRange;
        const replacedSelection = createSelectionState(blockKey, start, end);
        const newContentState = Modifier.replaceText(contentState, replacedSelection, text, null, replacedEntityKey);
        newContentState.mergeEntityData(replacedEntityKey, data);
        return EditorState.createWithContent(newContentState);
      }
    }

    return editorState;
  },

  getCurrentEntityKey: getCurrentEntityKey,

  getCurrentEntity: getCurrentEntity,

  hasEntity: hasEntity,

  removeLinkAtSelection: removeLinkAtSelection
};

export { createSelectionState };