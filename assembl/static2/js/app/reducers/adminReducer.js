import { fromJS, List, Map } from 'immutable';
import { combineReducers } from 'redux';

export const selectedLocale = (state = 'fr', action) => {
  switch (action.type) {
  case 'UPDATE_SELECTED_LOCALE':
    return action.newLocale;
  default:
    return state;
  }
};

export const thematicsInOrder = (state = List(), action) => {
  switch (action.type) {
  case 'CREATE_NEW_THEMATIC':
    return state.push(action.id);
  case 'UPDATE_THEMATICS': {
    return List(
        action.thematics.map((t) => {
          return t.id;
        })
      );
  }
  default:
    return state;
  }
};

export const thematicsById = (state = Map(), action) => {
  switch (action.type) {
  case 'CREATE_NEW_THEMATIC': {
    const emptyThematic = Map({
      toDelete: false,
      imgUrl: '',
      isNew: true,
      questions: List(),
      titleEntries: List(),
      video: Map({
        titleEntries: List(),
        descriptionEntries: List(),
        htmlCode: null
      })
    });
    return state.set(action.id, emptyThematic.set('id', action.id));
  }
  case 'DELETE_THEMATIC':
    return state.setIn([action.id, 'toDelete'], true);
  case 'UPDATE_THEMATIC_IMG_URL':
    return state.setIn([action.id, 'imgUrl'], action.value);
  case 'UPDATE_THEMATIC_TITLE': {
    const entries = state.getIn([action.id, 'titleEntries']);
    const index = entries.findIndex((e) => {
      return e.get('localeCode') === action.locale;
    });

    if (index === -1) {
      const newEntries = entries.push(Map({ localeCode: action.locale, value: action.value }));
      return state.setIn([action.id, 'titleEntries'], newEntries);
    }

    return state.setIn([action.id, 'titleEntries', index, 'value'], action.value);
  }
  case 'UPDATE_THEMATICS': {
    const newState = {};
    action.thematics.forEach((t) => {
      return (newState[t.id] = {
        ...t
      });
    });
    return fromJS(newState);
  }
  default:
    return state;
  }
};

export default combineReducers({
  selectedLocale: selectedLocale,
  thematicsInOrder: thematicsInOrder,
  thematicsById: thematicsById
});