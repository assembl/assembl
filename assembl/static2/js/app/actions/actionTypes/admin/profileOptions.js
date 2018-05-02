// @flow
export const UPDATE_TEXT_FIELDS: 'UPDATE_TEXT_FIELDS' = 'UPDATE_TEXT_FIELDS';
export const ADD_TEXT_FIELD: 'ADD_TEXT_FIELD' = 'ADD_TEXT_FIELD';
export const DELETE_TEXT_FIELD: 'DELETE_TEXT_FIELD' = 'DELETE_TEXT_FIELD';
export const UPDATE_TEXT_FIELD_TITLE: 'UPDATE_TEXT_FIELD_TITLE' = 'UPDATE_TEXT_FIELD_TITLE';

export type TextFields = Array<Object>; // TODO: use generated type
export type UpdateTextFields = {
  textFields: TextFields,
  type: typeof UPDATE_TEXT_FIELDS
};

export type AddTextField = {
  id: string,
  type: typeof ADD_TEXT_FIELD
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

export type ProfileOptionsActions = UpdateTextFields | AddTextField | DeleteTextField | UpdateTextFieldTitle;