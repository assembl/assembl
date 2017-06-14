export const updateSelectedLocale = (newLocale) => {
  return {
    newLocale: newLocale,
    type: 'UPDATE_SELECTED_LOCALE'
  };
};

export const updateThematics = (thematics) => {
  return {
    thematics: thematics,
    type: 'UPDATE_THEMATICS'
  };
};

export const updateThematicImgUrl = (id, value) => {
  return {
    id: id,
    value: value,
    type: 'UPDATE_THEMATIC_IMG_URL'
  };
};

export const updateThematicTitle = (id, locale, value) => {
  return {
    id: id,
    locale: locale,
    value: value,
    type: 'UPDATE_THEMATIC_TITLE'
  };
};

export const deleteThematic = (id) => {
  return {
    id: id,
    type: 'DELETE_THEMATIC'
  };
};

export const createNewThematic = (id) => {
  return {
    id: id,
    type: 'CREATE_NEW_THEMATIC'
  };
};