// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';

import * as actionTypes from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';
import { moveItemDown, moveItemUp } from '../../utils/globalFunctions';

export const profileOptionsHasChanged = (state: boolean = false, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.ADD_TEXT_FIELD:
  case actionTypes.DELETE_TEXT_FIELD:
  case actionTypes.UPDATE_TEXT_FIELD_TITLE:
  case actionTypes.TOGGLE_TEXT_FIELD_REQUIRED:
  case actionTypes.MOVE_TEXT_FIELD_DOWN:
  case actionTypes.MOVE_TEXT_FIELD_UP:
  case actionTypes.ADD_SELECT_FIELD_OPTION:
  case actionTypes.DELETE_SELECT_FIELD_OPTION:
  case actionTypes.UPDATE_SELECT_FIELD_OPTION_LABEL:
  case actionTypes.MOVE_SELECT_FIELD_OPTION_UP:
  case actionTypes.MOVE_SELECT_FIELD_OPTION_DOWN:
  case actionTypes.TOGGLE_TEXT_FIELD_HIDDEN:
    return true;
  case actionTypes.UPDATE_TEXT_FIELDS:
    return false;
  default:
    return state;
  }
};

const initialTextFields = Map();
export const textFieldsById = (state: Map<string, any> = initialTextFields, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_TEXT_FIELDS: {
    const textFieldsTuples = action.textFields.map((tf) => {
      const field = tf;
      const options = tf.options;
      delete field.options;
      const value = [
        field.id,
        fromJS(field)
          .set('_hasChanged', false)
          .set('_isNew', false)
          .set('_toDelete', false)
      ];
      if (Array.isArray(options)) {
        const optionsTuples = options.map(option => [option.id, fromJS(option).delete('label')]);
        value[1] = value[1].set('options', Map(optionsTuples));
      }
      return value;
    });
    return Map(textFieldsTuples);
  }
  case actionTypes.ADD_TEXT_FIELD: {
    let newState = state.set(
      action.id,
      Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: action.id,
        identifier: 'CUSTOM',
        order: state.size + 1.0,
        required: false,
        hidden: false,
        titleEntries: List()
      })
    );
    if (action.fieldType === 'select') {
      newState = newState.setIn([action.id, 'options'], Map());
    }
    return newState;
  }
  case actionTypes.ADD_SELECT_FIELD_OPTION: {
    return state
      .setIn(
        [action.fieldId, 'options', action.id],
        Map({
          id: action.id,
          order: state.getIn([action.fieldId, 'options']).size + 1.0,
          labelEntries: List()
        })
      )
      .setIn([action.fieldId, '_hasChanged'], true);
  }
  case actionTypes.DELETE_TEXT_FIELD:
    return state.setIn([action.id, '_toDelete'], true);
  case actionTypes.UPDATE_TEXT_FIELD_TITLE:
    return state
      .updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case actionTypes.TOGGLE_TEXT_FIELD_REQUIRED:
    return state.updateIn([action.id, 'required'], value => !value).setIn([action.id, '_hasChanged'], true);
  case actionTypes.TOGGLE_TEXT_FIELD_HIDDEN:
    return state.updateIn([action.id, 'hidden'], value => !value).setIn([action.id, '_hasChanged'], true);
  case actionTypes.MOVE_TEXT_FIELD_DOWN:
    return moveItemDown(state, action.id);
  case actionTypes.MOVE_TEXT_FIELD_UP:
    return moveItemUp(state, action.id);
  case actionTypes.DELETE_SELECT_FIELD_OPTION:
    return state.deleteIn([action.fieldId, 'options', action.id]).setIn([action.fieldId, '_hasChanged'], true);
  case actionTypes.UPDATE_SELECT_FIELD_OPTION_LABEL:
    return state
      .updateIn([action.fieldId, 'options', action.id, 'labelEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.fieldId, '_hasChanged'], true);
  case actionTypes.MOVE_SELECT_FIELD_OPTION_DOWN:
    return state
      .setIn([action.fieldId, 'options'], moveItemDown(state.getIn([action.fieldId, 'options']), action.id))
      .setIn([action.fieldId, '_hasChanged'], true);
  case actionTypes.MOVE_SELECT_FIELD_OPTION_UP:
    return state
      .setIn([action.fieldId, 'options'], moveItemUp(state.getIn([action.fieldId, 'options']), action.id))
      .setIn([action.fieldId, '_hasChanged'], true);
  default:
    return state;
  }
};

export default combineReducers({
  profileOptionsHasChanged: profileOptionsHasChanged,
  textFieldsById: textFieldsById
});