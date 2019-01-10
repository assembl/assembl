export const updateEditLocale = newLocale => ({
  newLocale: newLocale,
  type: 'UPDATE_EDIT_LOCALE'
});

export const displayLanguageMenu = state => ({ state: state, type: 'UPDATE_LANGUAGE_MENU_VISIBILITY' });