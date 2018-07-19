// @flow
export const UPDATE_TEXT_FIELDS: 'UPDATE_TEXT_FIELDS' = 'UPDATE_TEXT_FIELDS';
export const ADD_TEXT_FIELD: 'ADD_TEXT_FIELD' = 'ADD_TEXT_FIELD';
export const DELETE_TEXT_FIELD: 'DELETE_TEXT_FIELD' = 'DELETE_TEXT_FIELD';
export const UPDATE_TEXT_FIELD_TITLE: 'UPDATE_TEXT_FIELD_TITLE' = 'UPDATE_TEXT_FIELD_TITLE';
export const TOGGLE_TEXT_FIELD_REQUIRED: 'TOGGLE_TEXT_FIELD_REQUIRED' = 'TOGGLE_TEXT_FIELD_REQUIRED';
export const MOVE_TEXT_FIELD_UP: 'MOVE_TEXT_FIELD_UP' = 'MOVE_TEXT_FIELD_UP';
export const MOVE_TEXT_FIELD_DOWN: 'MOVE_TEXT_FIELD_DOWN' = 'MOVE_TEXT_FIELD_DOWN';
export const ADD_SELECT_FIELD_OPTION: 'ADD_SELECT_FIELD_OPTION' = 'ADD_SELECT_FIELD_OPTION';
export const DELETE_SELECT_FIELD_OPTION: 'DELETE_SELECT_FIELD_OPTION' = 'DELETE_SELECT_FIELD_OPTION';
export const UPDATE_SELECT_FIELD_OPTION_LABEL: 'UPDATE_SELECT_FIELD_OPTION_LABEL' = 'UPDATE_SELECT_FIELD_OPTION_LABEL';
export const MOVE_SELECT_FIELD_OPTION_UP: 'MOVE_SELECT_FIELD_OPTION_UP' = 'MOVE_SELECT_FIELD_OPTION_UP';
export const MOVE_SELECT_FIELD_OPTION_DOWN: 'MOVE_SELECT_FIELD_OPTION_DOWN' = 'MOVE_SELECT_FIELD_OPTION_DOWN';
export const TOGGLE_TEXT_FIELD_HIDDEN: 'TOGGLE_TEXT_FIELD_HIDDEN' = 'TOGGLE_TEXT_FIELD_HIDDEN';

export type TextFields = Array<Object>; // TODO: use generated type
export type UpdateTextFields = {
  textFields: TextFields,
  type: typeof UPDATE_TEXT_FIELDS
};

export type AddTextField = {
  id: string,
  type: typeof ADD_TEXT_FIELD,
  fieldType: string
};

export type DeleteTextField = {
  id: string,
  type: typeof DELETE_TEXT_FIELD
};

export type UpdateTextFieldTitle = {
  id: string,
  locale: string,
  value: string,
  type: typeof UPDATE_TEXT_FIELD_TITLE
};

export type ToggleTextFieldRequired = {
  id: string,
  type: typeof TOGGLE_TEXT_FIELD_REQUIRED
};

export type ToggleTextFieldHidden = {
  id: string,
  type: typeof TOGGLE_TEXT_FIELD_HIDDEN
};

export type MoveTextFieldUp = {
  id: string,
  type: typeof MOVE_TEXT_FIELD_UP
};

export type MoveTextFieldDown = {
  id: string,
  type: typeof MOVE_TEXT_FIELD_DOWN
};

export type AddSelectFieldOption = {
  fieldId: string,
  id: string,
  type: typeof ADD_SELECT_FIELD_OPTION
};

export type DeleteSelectFieldOption = {
  fieldId: string,
  id: string,
  type: typeof DELETE_SELECT_FIELD_OPTION
};

export type UpdateSelectFieldOptionLabel = {
  fieldId: string,
  id: string,
  locale: string,
  value: string,
  type: typeof UPDATE_SELECT_FIELD_OPTION_LABEL
};

export type MoveSelectFieldOptionUp = {
  fieldId: string,
  id: string,
  type: typeof MOVE_SELECT_FIELD_OPTION_UP
};

export type MoveSelectFieldOptionDown = {
  fieldId: string,
  id: string,
  type: typeof MOVE_SELECT_FIELD_OPTION_DOWN
};

export type ProfileOptionsActions =
  | UpdateTextFields
  | AddTextField
  | DeleteTextField
  | UpdateTextFieldTitle
  | MoveTextFieldUp
  | MoveTextFieldDown
  | AddSelectFieldOption
  | DeleteSelectFieldOption
  | UpdateSelectFieldOptionLabel
  | MoveSelectFieldOptionUp
  | MoveSelectFieldOptionDown;