// @flow
import { ContentState, EditorState } from 'draft-js';

export function createEditorStateFromText(text: string): EditorState {
  return EditorState.createWithContent(ContentState.createFromText(text));
}