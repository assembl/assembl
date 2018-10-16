import { ContentState, EditorState } from 'draft-js';
import { List, Map } from 'immutable';

/* eslint-disable import/no-extraneous-dependencies */
import TestUtils from 'assembl-test-editor-utils';
/* eslint-enable import/no-extraneous-dependencies */

import { createEditorStateFromText } from '../../helpers/draftjs';
import * as draftjs from '../../../js/app/utils/draftjs';

describe('draftjs utils', () => {
  describe('blockToHTML function', () => {
    const { blockToHTML } = draftjs;
    it('should return undefined for non atomic block', () => {
      const block = {
        type: 'unstyled'
      };
      const result = blockToHTML(block);
      expect(result).toBeUndefined();
    });

    it('should convert atomic block to a div', () => {
      const block = {
        type: 'atomic'
      };
      const result = blockToHTML(block);
      const expected = {
        start: '<div class="atomic-block" data-blocktype="atomic">',
        end: '</div>'
      };
      expect(result).toEqual(expected);
    });
  });

  describe('htmlToBlock function', () => {
    const { htmlToBlock } = draftjs;
    it('should create an atomic block if the node is an img tag', () => {
      const nodeName = 'img';
      const node = {};
      const lastList = null;
      const inBlock = 'unstyled';
      const result = htmlToBlock(nodeName, node, lastList, inBlock);
      const expected = 'atomic';
      expect(result).toEqual(expected);
    });

    it('should create an atomic block if the node is an atomic block (image)', () => {
      const node = document.createElement('div');
      node.dataset.blocktype = 'atomic';
      const child = document.createElement('img');
      child.dataset.id = 'foobar';
      child.dataset.mimeType = 'image/png';
      node.appendChild(child);
      const lastList = null;
      const inBlock = 'atomic';
      const result = htmlToBlock('div', node, lastList, inBlock);
      const expected = 'atomic';
      expect(result).toEqual(expected);
    });

    it('should create an atomic block if the node is an atomic block (non image)', () => {
      const node = document.createElement('div');
      node.dataset.blocktype = 'atomic';
      const child = document.createElement('a');
      const grandchild = document.createElement('img');
      grandchild.dataset.externalurl = 'http://www.example.com/mydoc.pdf';
      grandchild.dataset.id = 'foobar';
      grandchild.dataset.mimetype = 'application/pdf';
      child.appendChild(grandchild);
      node.appendChild(child);

      const lastList = null;
      const inBlock = 'atomic';
      const result = htmlToBlock('div', node, lastList, inBlock);
      const expected = 'atomic';
      expect(result).toEqual(expected);
    });
  });

  // describe('convertEntries function');
  describe('convertToEditorState function', () => {
    const { convertToEditorState } = draftjs;
    it('should convert empty string to editor state', () => {
      const actual = convertToEditorState('');
      expect(actual.getCurrentContent().hasText()).toBeFalsy();
    });

    it('should convert html to editor state', () => {
      const actual = convertToEditorState('<p>We need to hack the auxiliary PCI driver!</p>');
      const expected = EditorState.createWithContent(ContentState.createFromText('We need to hack the auxiliary PCI driver!'));
      expect(actual.getCurrentContent().getPlainText()).toEqual(expected.getCurrentContent().getPlainText());
    });
  });

  describe('convertContentStateToHTML function', () => {
    const { convertContentStateToHTML } = draftjs;
    it('should convert an empty editor state to html', () => {
      const cs = ContentState.createFromText('');
      const actual = convertContentStateToHTML(cs);
      const expected = '<p></p>';
      expect(actual).toEqual(expected);
    });

    it('should convert an editor state with text to html', () => {
      const cs = ContentState.createFromText('Use the redundant USB alarm!');
      const actual = convertContentStateToHTML(cs);
      const expected = '<p>Use the redundant USB alarm!</p>';
      expect(actual).toEqual(expected);
    });
  });

  describe('convertEditorStateToHTML function', () => {
    const { convertEditorStateToHTML } = draftjs;
    it('should convert an empty editor state to html', () => {
      const es = EditorState.createEmpty();
      const actual = convertEditorStateToHTML(es);
      const expected = '<p></p>';
      expect(actual).toEqual(expected);
    });

    it('should convert an editor state with text to html', () => {
      const es = createEditorStateFromText('Use the redundant USB alarm!');
      const actual = convertEditorStateToHTML(es);
      const expected = '<p>Use the redundant USB alarm!</p>';
      expect(actual).toEqual(expected);
    });
  });

  describe('convertEntriesToEditorState function', () => {
    const { convertEntriesToEditorState } = draftjs;
    it('should convert entries values to EditorState', () => {
      const entries = [
        {
          localeCode: 'en',
          value: '<p>foo</p>'
        },
        {
          localeCode: 'fr',
          value: '<p>toto</p>'
        }
      ];
      const actual = convertEntriesToEditorState(entries);
      let en;
      let fr;
      if (actual[0].localeCode === 'en') {
        en = actual[0];
        fr = actual[1];
      } else {
        en = actual[1];
        fr = actual[0];
      }
      expect(en.value.getCurrentContent().getPlainText()).toEqual('foo');
      expect(fr.value.getCurrentContent().getPlainText()).toEqual('toto');
    });
  });

  describe('convertImmutableEntriesToJS', () => {
    const { convertImmutableEntriesToJS } = draftjs;
    it('should convert immutable entries to an array of objects', () => {
      const enValue = createEditorStateFromText('hello');
      const frValue = createEditorStateFromText('salut');
      const input = List.of(Map({ localeCode: 'en', value: enValue }), Map({ localeCode: 'fr', value: frValue }));
      const actual = convertImmutableEntriesToJS(input);
      const expected = [{ localeCode: 'en', value: enValue }, { localeCode: 'fr', value: frValue }];
      expect(actual).toEqual(expected);
    });
  });

  describe('convertEntriesToHTML function', () => {
    const { convertEntriesToHTML } = draftjs;
    it('should do nothing with empty entries', () => {
      const actual = convertEntriesToHTML([]);
      const expected = [];
      expect(actual).toEqual(expected);
    });

    it('should convert entries values to html', () => {
      const entries = [
        {
          localeCode: 'en',
          value: EditorState.createWithContent(ContentState.createFromText('foo'))
        },
        {
          localeCode: 'fr',
          value: EditorState.createWithContent(ContentState.createFromText('toto'))
        }
      ];
      const actual = convertEntriesToHTML(entries);
      const expected = [
        {
          localeCode: 'en',
          value: '<p>foo</p>'
        },
        {
          localeCode: 'fr',
          value: '<p>toto</p>'
        }
      ];
      expect(actual).toEqual(expected);
    });
  });

  describe('editorStateIsEmpty function', () => {
    const { editorStateIsEmpty } = draftjs;
    it('should return true if editor state is empty', () => {
      const es = EditorState.createEmpty('');
      expect(editorStateIsEmpty(es)).toBeTruthy();
    });

    it('should return true if editor state is empty', () => {
      const es = createEditorStateFromText('');
      expect(editorStateIsEmpty(es)).toBeTruthy();
    });

    it('should return false if rawContentState is not empty', () => {
      const es = createEditorStateFromText('foo');
      expect(editorStateIsEmpty(es)).toBeFalsy();
    });
  });

  describe('uploadNewAttachments function', () => {
    const { uploadNewAttachments } = draftjs;
    it('should upload new attachments and return a promise with updated content state and the document ids', async () => {
      const fileB64 = window.btoa('gimme some base64');
      const myFile = new File([fileB64], 'my-file.pdf');
      const uploadDocumentSpy = jest.fn();
      const fakeResponse = {
        data: {
          uploadDocument: {
            document: {
              externalUrl: '/data/my-doc.pdf',
              id: 'my-doc-id',
              mimeType: 'application/pdf',
              title: 'My document'
            }
          }
        }
      };
      uploadDocumentSpy.mockImplementationOnce(() => Promise.resolve(fakeResponse));
      const editorState = TestUtils.createEditorStateWithTwoAttachments('my-img.jpg', myFile);
      const promise = uploadNewAttachments(editorState, uploadDocumentSpy);
      const result = await promise;
      const updatedContentState = result.contentState;
      const updatedEntityData = updatedContentState.getEntity('2').getData();
      expect(updatedEntityData).toEqual({
        id: 'my-doc-id',
        mimeType: 'application/pdf',
        src: '/data/my-doc.pdf',
        title: 'My document'
      });
      expect(result.documentIds).toEqual(['my-img-id', 'my-doc-id']);
      expect(uploadDocumentSpy).toHaveBeenCalledWith({ variables: { file: myFile } });
    });
  });
});