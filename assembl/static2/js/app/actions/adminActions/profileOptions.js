// @flow
import * as actionTypes from '../actionTypes/admin/profileOptions';

export const updateTextFields = (textFields: actionTypes.TextFields): actionTypes.UpdateTextFields => ({
  textFields: textFields,
  type: actionTypes.UPDATE_TEXT_FIELDS
});

export const addTextField = (id: string, fieldType: string = 'text'): actionTypes.AddTextField => ({
  id: id,
  type: actionTypes.ADD_TEXT_FIELD,
  fieldType: fieldType
});

export const deleteTextField = (id: string): actionTypes.DeleteTextField => ({
  id: id,
  type: actionTypes.DELETE_TEXT_FIELD
});

export const updateTextFieldTitle = (id: string, locale: string, value: string): actionTypes.UpdateTextFieldTitle => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TEXT_FIELD_TITLE
});

export const toggleTextFieldRequired = (id: string): actionTypes.ToggleTextFieldRequired => ({
  id: id,
  type: actionTypes.TOGGLE_TEXT_FIELD_REQUIRED
});

export const moveTextFieldUp = (id: string): actionTypes.MoveTextFieldUp => ({
  id: id,
  type: actionTypes.MOVE_TEXT_FIELD_UP
});

export const moveTextFieldDown = (id: string): actionTypes.MoveTextFieldDown => ({
  id: id,
  type: actionTypes.MOVE_TEXT_FIELD_DOWN
});