import { ContentState, EditorState } from 'draft-js';
import { List, Map } from 'immutable';

import { createEditorStateFromText } from '../../helpers/draftjs';
import * as draftjs from '../../../js/app/utils/draftjs';

describe('draftjs utils', () => {
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
});