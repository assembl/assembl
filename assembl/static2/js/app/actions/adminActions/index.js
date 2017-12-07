export const updateSelectedLocale = newLocale => ({
  newLocale: newLocale,
  type: 'UPDATE_SELECTED_LOCALE'
});

export const updateThematics = thematics => ({
  thematics: thematics,
  type: 'UPDATE_THEMATICS'
});

export const updateThematicImgUrl = (id, value) => ({
  id: id,
  value: value,
  type: 'UPDATE_THEMATIC_IMG_URL'
});

export const updateThematicTitle = (id, locale, value) => ({
  id: id,
  locale: locale,
  value: value,
  type: 'UPDATE_THEMATIC_TITLE'
});

export const deleteThematic = id => ({
  id: id,
  type: 'DELETE_THEMATIC'
});

export const createNewThematic = id => ({
  id: id,
  type: 'CREATE_NEW_THEMATIC'
});

export const addQuestionToThematic = (id, locale) => ({
  id: id,
  locale: locale,
  type: 'ADD_QUESTION_TO_THEMATIC'
});

export const updateQuestionTitle = (thematicId, index, locale, value) => ({
  thematicId: thematicId,
  index: index,
  locale: locale,
  value: value,
  type: 'UPDATE_QUESTION_TITLE'
});

export const removeQuestion = (thematicId, index) => ({
  thematicId: thematicId,
  index: index,
  type: 'REMOVE_QUESTION'
});

export const toggleVideo = id => ({ id: id, type: 'TOGGLE_VIDEO' });

export const updateVideoHtmlCode = (id, value) => ({ id: id, value: value, type: 'UPDATE_VIDEO_HTML_CODE' });

export const updateVideoDescriptionTop = (id, locale, value) => ({
  id: id,
  locale: locale,
  value: value,
  type: 'UPDATE_VIDEO_DESCRIPTION_TOP'
});

export const updateVideoDescriptionBottom = (id, locale, value) => ({
  id: id,
  locale: locale,
  value: value,
  type: 'UPDATE_VIDEO_DESCRIPTION_BOTTOM'
});

export const updateVideoDescriptionSide = (id, locale, value) => ({
  id: id,
  locale: locale,
  value: value,
  type: 'UPDATE_VIDEO_DESCRIPTION_SIDE'
});

export const updateVideoTitle = (id, locale, value) => ({ id: id, locale: locale, value: value, type: 'UPDATE_VIDEO_TITLE' });

export const addLanguagePreference = locale => ({ locale: locale, selected: true, type: 'ADD_LANGUAGE_PREFERENCE' });

export const removeLanguagePreference = locale => ({ locale: locale, selected: false, type: 'REMOVE_LANGUAGE_PREFERENCE' });

export const languagePreferencesHasChanged = state => ({ state: state, type: 'LANGUAGE_PREFERENCE_HAS_CHANGED' });