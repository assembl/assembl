// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';

import { type Action } from '../../actions/actionTypes';
import * as actionTypes from '../../actions/actionTypes/admin/profileOptions';
import { updateInLangstringEntries } from '../../utils/i18n';
import { moveItemDown, moveItemUp } from '../../utils/globalFunctions';

type ProfileOptionsHasChangedReducer = (boolean, ReduxAction<Action>) => boolean;
export const profileOptionsHasChanged: ProfileOptionsHasChangedReducer = (state = false, action) => {
  switch (action.type) {
  case actionTypes.ADD_TEXT_FIELD:
  case actionTypes.DELETE_TEXT_FIELD:
  case actionTypes.UPDATE_TEXT_FIELD_TITLE:
  case actionTypes.TOGGLE_TEXT_FIELD_REQUIRED:
  case actionTypes.MOVE_TEXT_FIELD_DOWN:
  case actionTypes.MOVE_TEXT_FIELD_UP:
    return true;
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
        identifier: 'CUSTOM',
        order: state.size + 1.0,
        required: false,
        titleEntries: List()
      })
    );

  case actionTypes.DELETE_TEXT_FIELD:
    return state.setIn([action.id, '_toDelete'], true);
  case actionTypes.UPDATE_TEXT_FIELD_TITLE:
    return state
      .updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case actionTypes.TOGGLE_TEXT_FIELD_REQUIRED:
    return state.updateIn([action.id, 'required'], value => !value).setIn([action.id, '_hasChanged'], true);
  case actionTypes.MOVE_TEXT_FIELD_DOWN:
    return moveItemDown(state, action.id).setIn([action.id, '_hasChanged'], true);
  case actionTypes.MOVE_TEXT_FIELD_UP:
    return moveItemUp(state, action.id).setIn([action.id, '_hasChanged'], true);
  default:
    return state;
  }
};

export default combineReducers({
  profileOptionsHasChanged: profileOptionsHasChanged,
  textFieldsById: textFieldsById
});