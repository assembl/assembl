// @flow
import { EditorState, Modifier, RichUtils } from 'draft-js';
import DraftJSPluginsUtils from 'draft-js-plugins-utils';

import TestUtils from './TestUtils';

type LinkData = {
  target: ?string,
  text: ?string,
  title: ?string,
  url: string
};

const { collapseToEnd, getCurrentEntity, getCurrentEntityKey, hasEntity, removeLinkAtSelection } = DraftJSPluginsUtils;

export const TestEditorUtils = TestUtils;

export default {
  collapseToEnd: collapseToEnd,

  createLinkAtSelection: function (editorState: EditorState, data: LinkData): EditorState {
    const { text, ...rest } = data;
    const contentState = editorState.getCurrentContent().createEntity('LINK', 'MUTABLE', rest);
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

  getCurrentEntityKey: getCurrentEntityKey,

  getCurrentEntity: getCurrentEntity,

  hasEntity: hasEntity,

  removeLinkAtSelection: removeLinkAtSelection
};