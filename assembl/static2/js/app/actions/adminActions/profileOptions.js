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

export const toggleTextFieldHidden = (id: string): actionTypes.ToggleTextFieldHidden => ({
  id: id,
  type: actionTypes.TOGGLE_TEXT_FIELD_HIDDEN
});

export const moveTextFieldUp = (id: string): actionTypes.MoveTextFieldUp => ({
  id: id,
  type: actionTypes.MOVE_TEXT_FIELD_UP
});

export const moveTextFieldDown = (id: string): actionTypes.MoveTextFieldDown => ({
  id: id,
  type: actionTypes.MOVE_TEXT_FIELD_DOWN
});

export const addSelectFieldOption = (fieldId: string, id: string): actionTypes.AddSelectFieldOption => ({
  fieldId: fieldId,
  id: id,
  type: actionTypes.ADD_SELECT_FIELD_OPTION
});

export const deleteSelectFieldOption = (fieldId: string, id: string): actionTypes.DeleteSelectFieldOption => ({
  fieldId: fieldId,
  id: id,
  type: actionTypes.DELETE_SELECT_FIELD_OPTION
});

export const updateSelectFieldOptionLabel = (
  fieldId: string,
  id: string,
  locale: string,
  value: string
): actionTypes.UpdateSelectFieldOptionLabel => ({
  fieldId: fieldId,
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_SELECT_FIELD_OPTION_LABEL
});

export const moveSelectFieldOptionUp = (fieldId: string, id: string): actionTypes.MoveSelectFieldOptionUp => ({
  fieldId: fieldId,
  id: id,
  type: actionTypes.MOVE_SELECT_FIELD_OPTION_UP
});

export const moveSelectFieldOptionDown = (fieldId: string, id: string): actionTypes.MoveSelectFieldOptionDown => ({
  fieldId: fieldId,
  id: id,
  type: actionTypes.MOVE_SELECT_FIELD_OPTION_DOWN
});