/*
  Utils related to draft-js library

  @flow
*/
import { type ContentBlock, type ContentState, EditorState, type EntityInstance } from 'draft-js';
import { convertFromHTML, convertToHTML } from 'draft-convert';
import { type List, type Map } from 'immutable';

// from our workspaces
/* eslint-disable import/no-extraneous-dependencies */
import { constants } from 'assembl-editor-utils';
import { converters as linkConverters } from 'draft-js-link-plugin';
import { converters as attachmentsConverters } from 'draft-js-attachment-plugin';
/* eslint-enable import/no-extraneous-dependencies */

type Entry = {
  localeCode: string,
  value: string | EditorState
};

const { ENTITY_TYPES } = constants;

export function blockToHTML(block: ContentBlock): { start: string, end: string } | void {
  if (block.type === 'atomic') {
    return { start: '<div class="atomic-block" data-blocktype="atomic">', end: '</div>' };
  }

  return undefined;
}

export function htmlToBlock(nodeName: string, node: HTMLElement, lastList: *, inBlock: string): void | string {
  const isAtomicBlock = nodeName === 'div' && node.dataset.blocktype === 'atomic';
  if (isAtomicBlock || (nodeName === 'img' && inBlock !== 'atomic')) {
    return 'atomic';
  }

  return undefined;
}

const customConvertFromHTML = convertFromHTML({
  htmlToBlock: htmlToBlock,
  htmlToEntity: function (nodeName: string, node: HTMLElement, createEntity: Function): EntityInstance | null {
    if (nodeName === 'a') {
      // $FlowFixMe: if nodeName is 'a', node should be an HTMLAnchorElement
      return linkConverters.htmlToEntity(nodeName, node, createEntity);
    }

    return attachmentsConverters.htmlToEntity(nodeName, node, createEntity);
  }
});

const customConvertToHTML = convertToHTML({
  blockToHTML: blockToHTML,
  entityToHTML: (entity: EntityInstance, originalText: string): string => {
    if (entity.type === ENTITY_TYPES.document || entity.type === ENTITY_TYPES.image) {
      return attachmentsConverters.entityToHTML(entity);
    } else if (entity.type === ENTITY_TYPES.link) {
      return linkConverters.entityToHTML(entity, originalText);
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

export function uploadNewAttachments(editorState: EditorState, uploadDocument: Function): Promise<*> {
  const documentIds = [];
  let contentState = editorState.getCurrentContent();
  const entities = [];
  contentState.getBlockMap().forEach((block) => {
    if (block.type === 'atomic') {
      block.findEntityRanges((entityRange) => {
        const entityKey = entityRange.entity;
        if (entityKey) {
          const entity = contentState.getEntity(entityKey);
          if (entity) {
            entities.push({
              entityKey: entityKey,
              entity: entity
            });
          }
        }
      });
    }
  });

  let uploadDocumentsPromise = Promise.resolve();
  entities.forEach((entityInfo) => {
    const { entity, entityKey } = entityInfo;
    if (entity.data.src instanceof File) {
      // this is a new document, add a promise to create it and modify its entity
      const variables = {
        file: entity.data.src
      };
      uploadDocumentsPromise = uploadDocumentsPromise.then(() =>
        uploadDocument({ variables: variables }).then((res) => {
          if (res && res.data) {
            const doc = res.data.uploadDocument.document;
            documentIds.push(doc.id);
            // update entity
            const { externalUrl, id, mimeType, title } = doc;
            contentState = contentState.replaceEntityData(entityKey, {
              id: id,
              src: externalUrl,
              title: title,
              mimeType: mimeType
            });
          }
        })
      );
    } else {
      documentIds.push(entity.data.id);
    }
  });

  return uploadDocumentsPromise.then(
    () =>
      new Promise((resolve) => {
        resolve({
          contentState: contentState,
          documentIds: documentIds
        });
      })
  );
}

export type UploadNewAttachmentsPromiseResult = {
  contentState: ?ContentState,
  documentIds: Array<string>
};