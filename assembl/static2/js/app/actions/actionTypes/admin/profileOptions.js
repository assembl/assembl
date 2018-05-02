// @flow
export const UPDATE_TEXT_FIELDS: 'UPDATE_TEXT_FIELDS' = 'UPDATE_TEXT_FIELDS';

export type TextFields = Array<Object>; // TODO: use generated type
export type UpdateTextFields = {
  textFields: TextFields,
  type: typeof UPDATE_TEXT_FIELDS
};

export type ProfileOptionsActions = UpdateTextFields;