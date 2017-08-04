import { convertToRaw, ContentState, EditorState } from 'draft-js';
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
      const actualRaw = convertToRaw(topPostBody(undefined, {}).getCurrentContent());
      expect(actualRaw.blocks.length).toEqual(1);
      expect(actualRaw.blocks[0].data).toEqual({});
      expect(actualRaw.blocks[0].text).toEqual('');
    });

    it('should return state by default', () => {
      const state = EditorState.createWithContent(ContentState.createFromText('New body'));
      const expected = 'New body';
      const actual = topPostBody(state, {});
      expect(actual.getCurrentContent().getPlainText()).toEqual(expected);
    });

    it('should handle UPDATE_TOP_POST_BODY action type', () => {
      const state = EditorState.createWithContent(ContentState.createFromText('Old body'));
      const newEditorState = EditorState.createWithContent(ContentState.createFromText('New body'));
      const action = {
        type: 'UPDATE_TOP_POST_BODY',
        topPostBody: newEditorState
      };
      const actual = topPostBody(state, action);
      const expected = 'New body';
      const actualPlainText = actual.getCurrentContent().getPlainText();
      expect(actualPlainText).toEqual(expected);
    });
  });

  describe('subjectTopPostRemainingChars reducer', () => {
    const { subjectTopPostRemainingChars } = reducers;
    it('should return the initial state', () => {
      expect(subjectTopPostRemainingChars(undefined, {})).toEqual(10000);
    });

    it('should return state by default', () => {
      const state = 1234;
      const expected = 1234;
      const actual = subjectTopPostRemainingChars(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_TOP_POST_SUBJECT_REMAINING_CHARS action type', () => {
      const state = 100;
      const action = {
        type: 'UPDATE_TOP_POST_SUBJECT_REMAINING_CHARS',
        subjectTopPostRemainingChars: 100
      };
      const actual = subjectTopPostRemainingChars(state, action);
      const expected = 100;
      expect(actual).toEqual(expected);
    });
  });

  describe('activeAnswerFormId reducer', () => {
    const { activeAnswerFormId } = reducers;
    it('should return the initial state', () => {
      expect(activeAnswerFormId(undefined, {})).toEqual(null);
    });

    it('should return state by default', () => {
      const state = null;
      const expected = null;
      const actual = activeAnswerFormId(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_ACTIVE_ANSWER_FORM_ID action type', () => {
      const state = '1234';
      const action = {
        type: 'UPDATE_ACTIVE_ANSWER_FORM_ID',
        activeAnswerFormId: '1234'
      };
      const actual = activeAnswerFormId(state, action);
      const expected = '1234';
      expect(actual).toEqual(expected);
    });
  });

  describe('answerPostBody reducer', () => {
    const { answerPostBody } = reducers;
    it('should return the initial state', () => {
      expect(answerPostBody(undefined, {})).toEqual('');
    });

    it('should return state by default', () => {
      const state = 'New subject';
      const expected = 'New subject';
      const actual = answerPostBody(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_ANSWER_POST_BODY action type', () => {
      const state = 'New subject';
      const action = {
        type: 'UPDATE_ANSWER_POST_BODY',
        answerPostBody: 'New subject'
      };
      const actual = answerPostBody(state, action);
      const expected = 'New subject';
      expect(actual).toEqual(expected);
    });
  });

  describe('bodyAnswerPostRemainingChars reducer', () => {
    const { bodyAnswerPostRemainingChars } = reducers;
    it('should return the initial state', () => {
      expect(bodyAnswerPostRemainingChars(undefined, {})).toEqual(10000);
    });

    it('should return state by default', () => {
      const state = 1234;
      const expected = 1234;
      const actual = bodyAnswerPostRemainingChars(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_ANSWER_POST_BODY_REMAINING_CHARS action type', () => {
      const state = 100;
      const action = {
        type: 'UPDATE_ANSWER_POST_BODY_REMAINING_CHARS',
        bodyAnswerPostRemainingChars: 100
      };
      const actual = bodyAnswerPostRemainingChars(state, action);
      const expected = 100;
      expect(actual).toEqual(expected);
    });
  });
});