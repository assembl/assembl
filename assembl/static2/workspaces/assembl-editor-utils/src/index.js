// @flow
import { EditorState, Modifier, RichUtils } from 'draft-js';

type LinkData = {
  target: ?string,
  text: ?string,
  title: ?string,
  url: string
};

export default {
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
  }
};