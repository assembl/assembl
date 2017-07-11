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

  describe('updateSubjectRemaingChars action', () => {
    const { updateSubjectRemaingChars } = actions;
    it('should return a UPDATE_SUBJECT_REMAINING_CHARS action type', () => {
      const expected = {
        subjectRemainingChars: 124,
        type: 'UPDATE_SUBJECT_REMAINING_CHARS'
      };
      const actual = updateSubjectRemaingChars(124);
      expect(actual).toEqual(expected);
    });
  });

  describe('updateBodyRemaingChars action', () => {
    const { updateBodyRemaingChars } = actions;
    it('should return a UPDATE_BODY_REMAINING_CHARS action type', () => {
      const expected = {
        bodyRemainingChars: 1204,
        type: 'UPDATE_BODY_REMAINING_CHARS'
      };
      const actual = updateBodyRemaingChars(1204);
      expect(actual).toEqual(expected);
    });
  });
});