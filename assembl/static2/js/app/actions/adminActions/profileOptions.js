// @flow
import * as actionTypes from '../actionTypes/admin/profileOptions';

export const updateTextFields = (textFields: actionTypes.TextFields): actionTypes.UpdateTextFields => ({
  textFields: textFields,
  type: actionTypes.UPDATE_TEXT_FIELDS
});