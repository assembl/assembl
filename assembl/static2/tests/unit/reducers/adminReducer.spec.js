import * as reducers from '../../../js/app/reducers/adminReducer';

describe('Admin reducers', () => {
  describe('selectedLocale reducer', () => {
    const { selectedLocale } = reducers;
    it('should return the initial state', () => {
      expect(selectedLocale(undefined, {})).toEqual('fr');
    });

    it('should return state by default', () => {
      const state = 'en';
      const expected = 'en';
      const actual = selectedLocale(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_SELECTED_LOCALE action type', () => {
      const state = 'en';
      const action = {
        type: 'UPDATE_SELECTED_LOCALE',
        newLocale: 'fr'
      };
      const actual = selectedLocale(state, action);
      const expected = 'fr';
      expect(actual).toEqual(expected);
    });
  });

  describe('surveyThemes reducer', () => {
    const { surveyThemes } = reducers;
    it('should return the initial state', () => {
      expect(surveyThemes(undefined, {})).toEqual([]);
    });

    it('should return state by default', () => {
      const state = ['0', '1'];
      const expected = ['0', '1'];
      const actual = surveyThemes(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle ADD_THEME_TO_SURVEY action type', () => {
      const state = ['0', '1'];
      const action = { type: 'ADD_THEME_TO_SURVEY', id: '42' };
      const expected = ['0', '1', '42'];
      const actual = surveyThemes(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle REMOVE_SURVEY_THEME action type', () => {
      const state = ['0', '1', '9', '11'];
      const action = { type: 'REMOVE_SURVEY_THEME', id: '9' };
      const expected = ['0', '1', '11'];
      const actual = surveyThemes(state, action);
      expect(actual).toEqual(expected);
    });
  });

  describe('surveyThemesById reducer', () => {
    const { surveyThemesById } = reducers;
    it('should return the initial state', () => {
      expect(surveyThemesById(undefined, {})).toEqual({});
    });

    it('should return state by default', () => {
      const state = {
        0: {
          title: 'Foo'
        }
      };
      const expected = {
        0: {
          title: 'Foo'
        }
      };
      const actual = surveyThemesById(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle ADD_THEME_TO_SURVEY action type', () => {
      const state = {
        0: { titlesByLocale: { fr: 'Bonjour', en: 'Hello' }, image: undefined },
        1: { titlesByLocale: { fr: 'Au revoir', en: 'Goodbye' }, image: undefined }
      };
      const expected = {
        0: { titlesByLocale: { fr: 'Bonjour', en: 'Hello' }, image: undefined },
        1: { titlesByLocale: { fr: 'Au revoir', en: 'Goodbye' }, image: undefined },
        2: { titlesByLocale: {}, image: undefined }
      };
      const action = { type: 'ADD_THEME_TO_SURVEY', id: '2' };
      const actual = surveyThemesById(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle REMOVE_SURVEY_THEME action type', () => {
      const state = {
        0: { titlesByLocale: { fr: 'Bonjour', en: 'Hello' }, image: undefined },
        1: { titlesByLocale: { fr: 'Au revoir', en: 'Goodbye' }, image: undefined }
      };
      const expected = {
        0: { titlesByLocale: { fr: 'Bonjour', en: 'Hello' }, image: undefined }
      };
      const action = { type: 'REMOVE_SURVEY_THEME', id: '1' };
      const actual = surveyThemesById(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_SURVEY_THEME_TITLE action type', () => {
      const state = {
        0: { titlesByLocale: { fr: 'Bonjour', en: 'Hello' }, image: undefined },
        1: { titlesByLocale: { fr: 'Au revoir', en: 'Goodbye' }, image: undefined }
      };
      const expected = {
        0: { titlesByLocale: { fr: 'Salut', en: 'Hello' }, image: undefined },
        1: { titlesByLocale: { fr: 'Au revoir', en: 'Goodbye' }, image: undefined }
      };
      const action = {
        newTitle: 'Salut',
        locale: 'fr',
        type: 'UPDATE_SURVEY_THEME_TITLE',
        themeId: '0'
      };
      const actual = surveyThemesById(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_SURVEY_THEME_IMAGE action type', () => {
      const myFile = { name: 'foobar.png' };
      const state = {
        0: { titlesByLocale: { fr: 'Bonjour', en: 'Hello' }, image: undefined },
        1: { titlesByLocale: { fr: 'Au revoir', en: 'Goodbye' }, image: undefined }
      };
      const expected = {
        0: { titlesByLocale: { fr: 'Bonjour', en: 'Hello' }, image: myFile },
        1: { titlesByLocale: { fr: 'Au revoir', en: 'Goodbye' }, image: undefined }
      };
      const action = {
        file: myFile,
        type: 'UPDATE_SURVEY_THEME_IMAGE',
        themeId: '0'
      };
      const actual = surveyThemesById(state, action);
      expect(actual).toEqual(expected);
    });
  });
});