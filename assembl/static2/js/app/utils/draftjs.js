/*
  Utils related to draft-js library

  @flow
*/
import { type ContentState, EditorState } from 'draft-js';
import { convertFromHTML, convertToHTML } from 'draft-convert';
import { type List, type Map } from 'immutable';

import attachmentsPlugin from '../components/common/richTextEditor/attachmentsPlugin';

type Entry = {
  localeCode: string,
  value: string | EditorState
};

const ATTACHMENT_ENTITY = 'document';

const customConvertFromHTML = convertFromHTML({
  htmlToBlock: attachmentsPlugin.htmlToBlock,
  htmlToEntity: function (nodeName: string, node: HTMLAnchorElement, createEntity: Function): EntityInstance | null {
    return attachmentsPlugin.htmlToEntity(nodeName, node, createEntity);
  }
});

const customConvertToHTML = convertToHTML({
  blockToHTML: attachmentsPlugin.blockToHTML,
  entityToHTML: (entity: EntityInstance, originalText: string): string => {
    if (entity.type === ATTACHMENT_ENTITY) {
      return attachmentsPlugin.entityToHTML(entity);
    }

    return originalText;
  }
});

export function convertEntries(converter: Function): Function {
  return function (entries: Array<Entry>): Array<Entry> {
    return entries.map(entry => ({
      ...entry,
      value: converter(entry.value)
    }));
  };
}

export function convertToEditorState(value: string): EditorState {
  if (value) {
    return EditorState.createWithContent(customConvertFromHTML(value));
  }

  return EditorState.createEmpty();
}

export const convertEntriesToEditorState = convertEntries(convertToEditorState);

export const convertContentStateToHTML = (cs: ContentState): string => customConvertToHTML(cs);

export const convertEditorStateToHTML = (es: EditorState): string => convertContentStateToHTML(es.getCurrentContent());

export function convertImmutableEntriesToJS(entries: List<Map<string, any>>): Array<Object> {
  return entries.map(entry => entry.toObject()).toArray();
}

export const convertEntriesToHTML = convertEntries(convertEditorStateToHTML);

export function editorStateIsEmpty(editorState: EditorState): boolean {
  const contentState = editorState.getCurrentContent();
  const containAtomicBlock = blockMap => blockMap.some(b => b.type === 'atomic');
  if (contentState.getPlainText().length === 0 && !containAtomicBlock(contentState.getBlockMap())) {
    return true;
  }

  return false;
}