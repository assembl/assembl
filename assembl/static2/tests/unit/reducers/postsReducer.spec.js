import { convertFromRaw, convertToRaw, ContentState } from 'draft-js';
import * as reducers from '../../../js/app/reducers/postsReducer';

describe('Posts reducers', () => {
  describe('topPostFormStatus reducer', () => {
    const { topPostFormStatus } = reducers;
    it('should return the initial state', () => {
      expect(topPostFormStatus(undefined, {})).toEqual(false);
    });

    it('should return state by default', () => {
      const state = false;
      const expected = false;
      const actual = topPostFormStatus(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_TOP_POST_FORM_STATUS action type', () => {
      const state = true;
      const action = {
        type: 'UPDATE_TOP_POST_FORM_STATUS',
        isTopPostFormActive: true
      };
      const actual = topPostFormStatus(state, action);
      const expected = true;
      expect(actual).toEqual(expected);
    });
  });

  describe('topPostSubject reducer', () => {
    const { topPostSubject } = reducers;
    it('should return the initial state', () => {
      expect(topPostSubject(undefined, {})).toEqual('');
    });

    it('should return state by default', () => {
      const state = 'New subject';
      const expected = 'New subject';
      const actual = topPostSubject(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_TOP_POST_SUBJECT action type', () => {
      const state = 'New subject';
      const action = {
        type: 'UPDATE_TOP_POST_SUBJECT',
        topPostSubject: 'New subject'
      };
      const actual = topPostSubject(state, action);
      const expected = 'New subject';
      expect(actual).toEqual(expected);
    });
  });

  describe('topPostBody reducer', () => {
    const { topPostBody } = reducers;
    it('should return the initial state', () => {
      const actual = topPostBody(undefined, {});
      expect(actual.blocks.length).toEqual(1);
      expect(actual.blocks[0].data).toEqual({});
      expect(actual.blocks[0].text).toEqual('');
    });

    it('should return state by default', () => {
      const state = convertToRaw(ContentState.createFromText('New body'));
      const expected = 'New body';
      const actual = topPostBody(state, {});
      expect(convertFromRaw(actual).getPlainText()).toEqual(expected);
    });

    it('should handle UPDATE_TOP_POST_BODY action type', () => {
      const state = convertToRaw(ContentState.createFromText('Old body'));
      const newTopPostBody = convertToRaw(ContentState.createFromText('New body'));
      const action = {
        type: 'UPDATE_TOP_POST_BODY',
        topPostBody: newTopPostBody
      };
      const actual = topPostBody(state, action);
      const expected = 'New body';
      const actualPlainText = convertFromRaw(actual).getPlainText();
      expect(actualPlainText).toEqual(expected);
    });
  });
});