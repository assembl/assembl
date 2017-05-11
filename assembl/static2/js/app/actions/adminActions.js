export const updateSelectedLocale = (newLocale) => {
  return {
    newLocale: newLocale,
    type: 'UPDATE_SELECTED_LOCALE'
  };
};

export const resolvedAddThemeToSurvey = (id) => {
  return {
    id: id,
    type: 'ADD_THEME_TO_SURVEY'
  };
};

export const addThemeToSurvey = () => {
  return (dispatch, getState) => {
    const newId = getState().admin.surveyThemes.length.toString();
    dispatch(resolvedAddThemeToSurvey(newId));
  };
};

export const updateThemeTitle = (themeId, locale, newTitle) => {
  return {
    themeId: themeId,
    locale: locale,
    newTitle: newTitle,
    type: 'UPDATE_SURVEY_THEME_TITLE'
  };
};

export const updateThemeImage = (themeId, file) => {
  return {
    themeId: themeId,
    file: file,
    type: 'UPDATE_SURVEY_THEME_IMAGE'
  };
};

export const removeTheme = (id) => {
  return {
    id: id,
    type: 'REMOVE_SURVEY_THEME'
  };
};