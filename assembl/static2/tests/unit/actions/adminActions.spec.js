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
});