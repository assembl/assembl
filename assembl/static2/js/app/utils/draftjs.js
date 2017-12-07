/*
  Utils related to draft-js library

  @flow
*/
import { convertToRaw, convertFromRaw, ContentState, EditorState, RawContentState } from 'draft-js';
import { convertFromHTML, convertToHTML } from 'draft-convert';

import attachmentsPlugin from '../components/common/richTextEditor/attachmentsPlugin';

type Entry = {
  localeCode: string,
  value: string | EditorState
};

const customConvertFromHTML = convertFromHTML({
  htmlToBlock: attachmentsPlugin.htmlToBlock,
  htmlToEntity: attachmentsPlugin.htmlToEntity
});

const customConvertToHTML = convertToHTML({
  blockToHTML: attachmentsPlugin.blockToHTML,
  entityToHTML: attachmentsPlugin.entityToHTML
});

export function createEmptyEditorState(): EditorState {
  return EditorState.createEmpty();
}

export function createEmptyRawContentState(): RawContentState {
  return convertToRaw(ContentState.createFromText(''));
}

export const textToRawContentState = (text: string): RawContentState => convertToRaw(ContentState.createFromText(text));

export function convertToRawContentState(value: string): RawContentState {
  return convertToRaw(customConvertFromHTML(value));
}

export function convertEntries(converter: Function): Function {
  return function (entries: Array<Entry>): Array<Entry> {
    return entries.map(entry => ({
      ...entry,
      value: converter(entry.value)
    }));
  };
}

export const convertEntriesToRawContentState = convertEntries(convertToRawContentState);
export const convertRawContentStateToHTML = (cs: RawContentState): string => customConvertToHTML(convertFromRaw(cs));
export const convertEntriesToHTML = convertEntries(convertRawContentStateToHTML);

export function rawContentStateIsEmpty(rawContentState: RawContentState): boolean {
  const contentState = convertFromRaw(rawContentState);
  const containAtomicBlock = blockMap => blockMap.some(b => b.type === 'atomic');
  if (contentState.getPlainText().length === 0 && !containAtomicBlock(contentState.getBlockMap())) {
    return true;
  }

  return false;
}