export const updateEditLocale = newLocale => ({
  newLocale: newLocale,
  type: 'UPDATE_EDIT_LOCALE'
});

export const addLanguagePreference = locale => ({ locale: locale, selected: true, type: 'ADD_LANGUAGE_PREFERENCE' });

export const displayLanguageMenu = state => ({ state: state, type: 'UPDATE_LANGUAGE_MENU_VISIBILITY' });