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

  describe('resolvedAddThemeToSurvey action', () => {
    const { resolvedAddThemeToSurvey } = actions;
    it('should return a ADD_THEME_TO_SURVEY action type', () => {
      const expected = {
        id: 'foo',
        type: 'ADD_THEME_TO_SURVEY'
      };
      const actual = resolvedAddThemeToSurvey('foo');
      expect(actual).toEqual(expected);
    });
  });

  describe('addThemeToSurvey action', () => {
    const { addThemeToSurvey, resolvedAddThemeToSurvey } = actions;
    it('should return a function that dispatch resolvedAddThemeToSurvey', () => {
      const outputFunction = addThemeToSurvey('foo');
      const getStateMock = () => {
        return {
          admin: {
            surveyThemes: ['foo', 'bar']
          }
        };
      };
      var actual;
      const dispatchMock = (x) => {
        actual = x;
      };
      outputFunction(dispatchMock, getStateMock);
      const expected = resolvedAddThemeToSurvey('2');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateThemeTitle action', () => {
    const { updateThemeTitle } = actions;
    it('should return a UPDATE_SURVEY_THEME_TITLE action type', () => {
      const expected = {
        locale: 'fr',
        themeId: '33',
        newTitle: 'Les enjeux de l\'intelligence artificielle',
        type: 'UPDATE_SURVEY_THEME_TITLE'
      };
      const actual = updateThemeTitle('33', 'fr', 'Les enjeux de l\'intelligence artificielle');
      expect(actual).toEqual(expected);
    });
  });
});