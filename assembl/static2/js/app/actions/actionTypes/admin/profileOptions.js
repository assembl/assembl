// @flow
export const UPDATE_TEXT_FIELDS: 'UPDATE_TEXT_FIELDS' = 'UPDATE_TEXT_FIELDS';
export const ADD_TEXT_FIELD: 'ADD_TEXT_FIELD' = 'ADD_TEXT_FIELD';

export type TextFields = Array<Object>; // TODO: use generated type
export type UpdateTextFields = {
  textFields: TextFields,
  type: typeof UPDATE_TEXT_FIELDS
};

export type AddTextField = {
  id: string,
  type: typeof ADD_TEXT_FIELD
};

export type ProfileOptionsActions = UpdateTextFields | AddTextField;