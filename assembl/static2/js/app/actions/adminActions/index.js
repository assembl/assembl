export const updateEditLocale = newLocale => ({
  newLocale: newLocale,
  type: 'UPDATE_EDIT_LOCALE'
});

export const addLanguagePreference = locale => ({ locale: locale, selected: true, type: 'ADD_LANGUAGE_PREFERENCE' });

export const removeLanguagePreference = locale => ({ locale: locale, selected: false, type: 'REMOVE_LANGUAGE_PREFERENCE' });

export const languagePreferencesHasChanged = state => ({ state: state, type: 'LANGUAGE_PREFERENCE_HAS_CHANGED' });

export const displayLanguageMenu = state => ({ state: state, type: 'UPDATE_LANGUAGE_MENU_VISIBILITY' });