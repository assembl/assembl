import * as actions from '../../../js/app/actions/adminActions';

describe('Admin actions', () => {
  describe('updateSelectedLocale action', () => {
    const { updateSelectedLocale } = actions;
    it('should return a UPDATE_SELECTED_LOCALE action type', () => {
      const expected = {
        newLocale: 'de',
        type: 'UPDATE_SELECTED_LOCALE'
      };
      const actual = updateSelectedLocale('de');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateThematics action', () => {
    const { updateThematics } = actions;
    it('should return a UPDATE_THEMATICS action type', () => {
      const thematics = [{ id: '0', titleEntries: [{ localeCode: 'en', value: 'Foo ' }] }, { id: '1', titleEntries: [{ localeCode: 'en', value: 'Bar ' }] }];
      const actual = updateThematics(thematics);
      const expected = {
        thematics: thematics,
        type: 'UPDATE_THEMATICS'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateThematicImgUrl action', () => {
    const { updateThematicImgUrl } = actions;
    it('should return a UPDATE_THEMATIC_IMG_URL action type', () => {
      const actual = updateThematicImgUrl('1', 'http://example.com/foobar.jpg');
      const expected = {
        id: '1',
        value: 'http://example.com/foobar.jpg',
        type: 'UPDATE_THEMATIC_IMG_URL'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateThematicTitle action', () => {
    const { updateThematicTitle } = actions;
    it('should return a UPDATE_THEMATIC_TITLE action type', () => {
      const actual = updateThematicTitle('1', 'en', 'New title');
      const expected = {
        id: '1',
        locale: 'en',
        value: 'New title',
        type: 'UPDATE_THEMATIC_TITLE'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('deleteThematic action', () => {
    const { deleteThematic } = actions;
    it('should return a DELETE_THEMATIC action type', () => {
      const actual = deleteThematic('1');
      const expected = {
        id: '1',
        type: 'DELETE_THEMATIC'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('createNewThematic action', () => {
    const { createNewThematic } = actions;
    it('should return a CREATE_NEW_THEMATIC action type', () => {
      const actual = createNewThematic('1');
      const expected = {
        id: '1',
        type: 'CREATE_NEW_THEMATIC'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('addQuestionToThematic action', () => {
    const { addQuestionToThematic } = actions;
    it('should return a ADD_QUESTION_TO_THEMATIC action type', () => {
      const actual = addQuestionToThematic('1');
      const expected = {
        id: '1',
        type: 'ADD_QUESTION_TO_THEMATIC'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateQuestionTitle action', () => {
    const { updateQuestionTitle } = actions;
    it('should return a UPDATE_QUESTION_TITLE action type', () => {
      const actual = updateQuestionTitle('1', '2', 'en', 'New title');
      const expected = {
        thematicId: '1',
        index: '2',
        locale: 'en',
        value: 'New title',
        type: 'UPDATE_QUESTION_TITLE'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('removeQuestion action', () => {
    const { removeQuestion } = actions;
    it('should return a REMOVE_QUESTION action type', () => {
      const actual = removeQuestion('1', '2');
      const expected = {
        thematicId: '1',
        index: '2',
        type: 'REMOVE_QUESTION'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('toggleVideo action', () => {
    const { toggleVideo } = actions;
    it('should return a TOGGLE_VIDEO action type', () => {
      const actual = toggleVideo('my-thematic-id');
      const expected = { id: 'my-thematic-id', type: 'TOGGLE_VIDEO' };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateVideoHtmlCode action', () => {
    const { updateVideoHtmlCode } = actions;
    it('should return a UPDATE_VIDEO_HTML_CODE action type', () => {
      const actual = updateVideoHtmlCode('my-thematic-id', 'foobar');
      const expected = { id: 'my-thematic-id', value: 'foobar', type: 'UPDATE_VIDEO_HTML_CODE' };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateVideoDescription action', () => {
    const { updateVideoDescription } = actions;
    it('should return a UPDATE_VIDEO_DESCRIPTION action type', () => {
      const actual = updateVideoDescription('my-thematic-id', 'en', 'foobar');
      const expected = { id: 'my-thematic-id', locale: 'en', value: 'foobar', type: 'UPDATE_VIDEO_DESCRIPTION' };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateVideoTitle action', () => {
    const { updateVideoTitle } = actions;
    it('should return a UPDATE_VIDEO_TITLE action type', () => {
      const actual = updateVideoTitle('my-thematic-id', 'en', 'foobar');
      const expected = { id: 'my-thematic-id', locale: 'en', value: 'foobar', type: 'UPDATE_VIDEO_TITLE' };
      expect(actual).toEqual(expected);
    });
  });
});