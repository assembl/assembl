// @flow
import * as actionTypes from '../actionTypes';

export const updateTextFields = (textFields: Array<Object>) => ({
  textFields: textFields,
  type: actionTypes.UPDATE_TEXT_FIELDS
});

export const addTextField = (id: string, fieldType: string = 'text') => ({
  id: id,
  type: actionTypes.ADD_TEXT_FIELD,
  fieldType: fieldType
});

export const deleteTextField = (id: string) => ({
  id: id,
  type: actionTypes.DELETE_TEXT_FIELD
});

export const updateTextFieldTitle = (id: string, locale: string, value: string) => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TEXT_FIELD_TITLE
});

export const toggleTextFieldRequired = (id: string) => ({
  id: id,
  type: actionTypes.TOGGLE_TEXT_FIELD_REQUIRED
});

export const toggleTextFieldHidden = (id: string) => ({
  id: id,
  type: actionTypes.TOGGLE_TEXT_FIELD_HIDDEN
});

export const moveTextFieldUp = (id: string) => ({
  id: id,
  type: actionTypes.MOVE_TEXT_FIELD_UP
});

export const moveTextFieldDown = (id: string) => ({
  id: id,
  type: actionTypes.MOVE_TEXT_FIELD_DOWN
});

export const addSelectFieldOption = (fieldId: string, id: string) => ({
  fieldId: fieldId,
  id: id,
  type: actionTypes.ADD_SELECT_FIELD_OPTION
});

export const deleteSelectFieldOption = (fieldId: string, id: string) => ({
  fieldId: fieldId,
  id: id,
  type: actionTypes.DELETE_SELECT_FIELD_OPTION
});

export const updateSelectFieldOptionLabel = (fieldId: string, id: string, locale: string, value: string) => ({
  fieldId: fieldId,
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_SELECT_FIELD_OPTION_LABEL
});

export const moveSelectFieldOptionUp = (fieldId: string, id: string) => ({
  fieldId: fieldId,
  id: id,
  type: actionTypes.MOVE_SELECT_FIELD_OPTION_UP
});

export const moveSelectFieldOptionDown = (fieldId: string, id: string) => ({
  fieldId: fieldId,
  id: id,
  type: actionTypes.MOVE_SELECT_FIELD_OPTION_DOWN
});