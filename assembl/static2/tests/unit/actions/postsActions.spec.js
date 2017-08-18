import { ContentState, EditorState } from 'draft-js';

import * as actions from '../../../js/app/actions/postsActions';

describe('Posts actions', () => {
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
      const body = EditorState.createWithContent(ContentState.createFromText('New body'));
      const expected = {
        topPostBody: body,
        type: 'UPDATE_TOP_POST_BODY'
      };
      const actual = updateTopPostBody(body);
      expect(actual).toEqual(expected);
    });
  });
});