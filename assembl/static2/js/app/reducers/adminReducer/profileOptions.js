// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';
import { type Action } from '../../actions/actionTypes';
import * as actionTypes from '../../actions/actionTypes/admin/profileOptions';
import { updateInLangstringEntries } from '../../utils/i18n';

type ProfileOptionsHasChangedReducer = (boolean, ReduxAction<Action>) => boolean;
export const profileOptionsHasChanged: ProfileOptionsHasChangedReducer = (state = false, action) => {
  switch (action.type) {
  case actionTypes.UPDATE_TEXT_FIELDS:
    return false;
  default:
    return state;
  }
};

const initialTextFields = Map();
type TextFieldsByIdState = Map<string, any>;
type TextFieldsByIdReducer = (TextFieldsByIdState, ReduxAction<Action>) => TextFieldsByIdState;
export const textFieldsById: TextFieldsByIdReducer = (state = initialTextFields, action) => {
  switch (action.type) {
  case actionTypes.UPDATE_TEXT_FIELDS: {
    const textFieldsTuples = action.textFields.map(tf => [
      tf.id,
      fromJS(tf)
        .set('_hasChanged', false)
        .set('_isNew', false)
        .set('_toDelete', false)
    ]);
    return Map(textFieldsTuples);
  }
  case actionTypes.ADD_TEXT_FIELD:
    return state.set(
      action.id,
      Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: action.id,
        order: state.size + 1.0,
        required: false,
        titleEntries: List()
      })
    );

  case actionTypes.DELETE_TEXT_FIELD:
    return state.setIn([action.id, '_toDelete'], true);
  case actionTypes.UPDATE_TEXT_FIELD_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  case actionTypes.TOGGLE_TEXT_FIELD_REQUIRED:
    return state.updateIn([action.id, 'required'], value => !value);
  default:
    return state;
  }
};

export default combineReducers({
  profileOptionsHasChanged: profileOptionsHasChanged,
  textFieldsById: textFieldsById
});