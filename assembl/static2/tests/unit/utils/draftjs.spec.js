import { convertFromRaw } from 'draft-js';

import * as draftjs from '../../../js/app/utils/draftjs';

describe('draftjs utils', () => {
  describe('createEmptyEditorState function', () => {
    const { createEmptyEditorState } = draftjs;
    it('should create an empty editor state', () => {
      const actual = createEmptyEditorState();
      expect(actual.getCurrentContent().getPlainText()).toEqual('');
    });
  });

  describe('textToRawContentState function', () => {
    const { textToRawContentState } = draftjs;
    it('should convert a string to an EditorState record', () => {
      const actual = textToRawContentState('foobar');
      const expected = {
        entityMap: {},
        blocks: [
          {
            text: 'foobar',
            type: 'unstyled'
          }
        ]
      };
      expect(actual.entityMap).toEqual(expected.entityMap);
      expect(actual.blocks[0].text).toEqual(expected.blocks[0].text);
      expect(actual.blocks[0].type).toEqual(expected.blocks[0].type);
    });
  });

  describe('convertEntriesToRawContentState function', () => {
    const { convertEntriesToRawContentState, textToRawContentState } = draftjs;
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
      const actual = convertEntriesToRawContentState(entries);
      const expected = [
        {
          localeCode: 'en',
          value: textToRawContentState('foo')
        },
        {
          localeCode: 'fr',
          value: textToRawContentState('toto')
        }
      ];
      expect(actual.length).toEqual(expected.length);
      expect(convertFromRaw(actual[0].value).getPlainText()).toEqual(convertFromRaw(expected[0].value).getPlainText());
      expect(convertFromRaw(actual[1].value).getPlainText()).toEqual(convertFromRaw(expected[1].value).getPlainText());
    });
  });

  describe('convertRawContentStateToHTML function', () => {
    const { convertRawContentStateToHTML, textToRawContentState } = draftjs;
    it('should convert a raw content state to HTML', () => {
      const rcs = textToRawContentState('foobar');
      const actual = convertRawContentStateToHTML(rcs);
      const expected = '<p>foobar</p>';
      expect(actual).toEqual(expected);
    });
  });

  describe('convertEntriesToHTML function', () => {
    const { convertEntriesToHTML, textToRawContentState } = draftjs;
    it('should do nothing with empty entries', () => {
      const actual = convertEntriesToHTML([]);
      const expected = [];
      expect(actual).toEqual(expected);
    });

    it('should convert entries values to html', () => {
      const entries = [
        {
          localeCode: 'en',
          value: textToRawContentState('foo')
        },
        {
          localeCode: 'fr',
          value: textToRawContentState('toto')
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
});