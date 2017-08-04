import * as actions from '../../../js/app/actions/postsActions';

describe('Posts actions', () => {
  describe('togglePostResponses action', () => {
    const { togglePostResponses } = actions;
    it('should return a TOGGLE_POST_RESPONSES action type', () => {
      const expected = {
        id: '1234',
        type: 'TOGGLE_POST_RESPONSES'
      };
      const actual = togglePostResponses('1234');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateTopPostFormStatus action', () => {
    const { updateTopPostFormStatus } = actions;
    it('should return a UPDATE_TOP_POST_FORM_STATUS action type', () => {
      const expected = {
        isTopPostFormActive: true,
        type: 'UPDATE_TOP_POST_FORM_STATUS'
      };
      const actual = updateTopPostFormStatus(true);
      expect(actual).toEqual(expected);
    });
  });

  describe('updateTopPostSubject action', () => {
    const { updateTopPostSubject } = actions;
    it('should return a UPDATE_TOP_POST_SUBJECT action type', () => {
      const expected = {
        topPostSubject: 'New subject',
        type: 'UPDATE_TOP_POST_SUBJECT'
      };
      const actual = updateTopPostSubject('New subject');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateTopPostBody action', () => {
    const { updateTopPostBody } = actions;
    it('should return a UPDATE_TOP_POST_BODY action type', () => {
      const expected = {
        topPostBody: 'New body',
        type: 'UPDATE_TOP_POST_BODY'
      };
      const actual = updateTopPostBody('New body');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateTopPostSubjectRemaingChars action', () => {
    const { updateTopPostSubjectRemaingChars } = actions;
    it('should return a UPDATE_TOP_POST_SUBJECT_REMAINING_CHARS action type', () => {
      const expected = {
        subjectTopPostRemainingChars: 124,
        type: 'UPDATE_TOP_POST_SUBJECT_REMAINING_CHARS'
      };
      const actual = updateTopPostSubjectRemaingChars(124);
      expect(actual).toEqual(expected);
    });
  });

  describe('updateActiveAnswerFormId action', () => {
    const { updateActiveAnswerFormId } = actions;
    it('should return a UPDATE_ACTIVE_ANSWER_FORM_ID action type', () => {
      const expected = {
        activeAnswerFormId: '1204',
        type: 'UPDATE_ACTIVE_ANSWER_FORM_ID'
      };
      const actual = updateActiveAnswerFormId('1204');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateAnswerPostBody action', () => {
    const { updateAnswerPostBody } = actions;
    it('should return a UPDATE_ANSWER_POST_BODY action type', () => {
      const expected = {
        answerPostBody: 'New body',
        type: 'UPDATE_ANSWER_POST_BODY'
      };
      const actual = updateAnswerPostBody('New body');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateAnswerPostBodyRemaingChars action', () => {
    const { updateAnswerPostBodyRemaingChars } = actions;
    it('should return a UPDATE_ANSWER_POST_BODY action type', () => {
      const expected = {
        bodyAnswerPostRemainingChars: 102,
        type: 'UPDATE_ANSWER_POST_BODY_REMAINING_CHARS'
      };
      const actual = updateAnswerPostBodyRemaingChars(102);
      expect(actual).toEqual(expected);
    });
  });
});