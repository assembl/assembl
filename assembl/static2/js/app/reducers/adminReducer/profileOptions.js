// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, Map } from 'immutable';
import { type Action } from '../../actions/actionTypes';
import * as actionTypes from '../../actions/actionTypes/admin/profileOptions';

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
  default:
    return state;
  }
};

export default combineReducers({
  profileOptionsHasChanged: profileOptionsHasChanged,
  textFieldsById: textFieldsById
});