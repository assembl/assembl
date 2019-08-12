// @flow
import * as actions from '../../../../js/app/actions/adminActions/adminSections';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('adminSections admin actions', () => {
  describe('updateSections action', () => {
    const { updateSections } = actions;
    it('should return a UPDATE_SECTIONS action type', () => {
      const sections = [
        {
          id: '1234',
          order: 0,
          sectionType: 'HOMEPAGE',
          url: null,
          titleEntries: [{ value: 'Home', localeCode: 'en' }, { value: 'Accueil', localeCode: 'fr' }]
        },
        {
          id: '2345',
          order: 1,
          sectionType: 'CUSTOM',
          url: null,
          titleEntries: [{ value: 'New', localeCode: 'en' }, { value: 'Nouveau', localeCode: 'fr' }]
        }
      ];
      const actual = updateSections(sections);
      const expected = { sections: sections, type: actionTypes.UPDATE_SECTIONS };
      expect(actual).toEqual(expected);
    });
  });

  describe('createSection action', () => {
    const { createSection } = actions;
    it('should return a CREATE_SECTION action type', () => {
      const actual = createSection('-212334', 1);
      const expected = { id: '-212334', order: 1, type: actionTypes.CREATE_SECTION };
      expect(actual).toEqual(expected);
    });
  });

  describe('deleteSection action', () => {
    const { deleteSection } = actions;
    it('should return a DELETE_SECTION action type', () => {
      const actual = deleteSection('-212334');
      const expected = { id: '-212334', type: actionTypes.DELETE_SECTION };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateSectionTitle action', () => {
    const { updateSectionTitle } = actions;
    it('should return a UPDATE_SECTION_TITLE action type', () => {
      const actual = updateSectionTitle('1234567', 'en', 'new title');
      const expected = {
        id: '1234567',
        locale: 'en',
        value: 'new title',
        type: actionTypes.UPDATE_SECTION_TITLE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateSectionUrl action', () => {
    const { updateSectionUrl } = actions;
    it('should return a UPDATE_SECTION_URL action type', () => {
      const actual = updateSectionUrl('1234567', 'new url');
      const expected = {
        id: '1234567',
        value: 'new url',
        type: actionTypes.UPDATE_SECTION_URL
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('toggleExternalPage action', () => {
    const { toggleExternalPage } = actions;
    it('should return a TOGGLE_EXTERNAL_PAGE action type', () => {
      const actual = toggleExternalPage('1234567');
      const expected = {
        id: '1234567',
        type: actionTypes.TOGGLE_EXTERNAL_PAGE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('moveSectionUp action', () => {
    const { moveSectionUp } = actions;
    it('should return a MOVE_UP_SECTION action type', () => {
      const actual = moveSectionUp('1234567');
      const expected = {
        id: '1234567',
        type: actionTypes.MOVE_UP_SECTION
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('moveSectionDown action', () => {
    const { moveSectionDown } = actions;
    it('should return a MOVE_DOWN_SECTION action type', () => {
      const actual = moveSectionDown('1234567');
      const expected = {
        id: '1234567',
        type: actionTypes.MOVE_DOWN_SECTION
      };
      expect(actual).toEqual(expected);
    });
  });
});