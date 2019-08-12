// @flow
import * as actions from '../../../../js/app/actions/adminActions/profileOptions';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('profileOptions admin actions', () => {
  describe('updateTextFields action', () => {
    const { updateTextFields } = actions;
    it('should return a UPDATE_TEXT_FIELDS action type', () => {
      const textFields = [
        {
          id: '1',
          order: 1,
          required: true,
          titleEntries: [{ value: 'Firstname', localeCode: 'en' }, { value: 'Prénom', localeCode: 'fr' }]
        },
        {
          id: '2',
          order: 2,
          required: false,
          titleEntries: [{ value: 'Lastname', localeCode: 'en' }, { value: 'Nom', localeCode: 'fr' }]
        }
      ];
      const actual = updateTextFields(textFields);
      const expected = { textFields: textFields, type: actionTypes.UPDATE_TEXT_FIELDS };
      expect(actual).toEqual(expected);
    });
  });

  describe('addTextField action', () => {
    const { addTextField } = actions;
    it('should return a ADD_TEXT_FIELD action type', () => {
      const actual = addTextField('foobar');
      const expected = { id: 'foobar', type: actionTypes.ADD_TEXT_FIELD, fieldType: 'text' };
      expect(actual).toEqual(expected);
    });

    it('should return a ADD_TEXT_FIELD select action type', () => {
      const actual = addTextField('foobar', 'select');
      const expected = { id: 'foobar', type: actionTypes.ADD_TEXT_FIELD, fieldType: 'select' };
      expect(actual).toEqual(expected);
    });
  });

  describe('deleteTextField action', () => {
    const { deleteTextField } = actions;
    it('should return a DELETE_TEXT_FIELD action type', () => {
      const actual = deleteTextField('foobar');
      const expected = { id: 'foobar', type: actionTypes.DELETE_TEXT_FIELD };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateTextFieldTitle action', () => {
    const { updateTextFieldTitle } = actions;
    it('should return a UPDATE_TEXT_FIELD_TITLE action type', () => {
      const actual = updateTextFieldTitle('my-field', 'en', 'New title');
      const expected = { id: 'my-field', locale: 'en', value: 'New title', type: actionTypes.UPDATE_TEXT_FIELD_TITLE };
      expect(actual).toEqual(expected);
    });
  });

  describe('toggleTextFieldRequired action', () => {
    const { toggleTextFieldRequired } = actions;
    it('should return a TOGGLE_TEXT_FIELD_REQUIRED action type', () => {
      const actual = toggleTextFieldRequired('my-field');
      const expected = { id: 'my-field', type: actionTypes.TOGGLE_TEXT_FIELD_REQUIRED };
      expect(actual).toEqual(expected);
    });
  });

  describe('toggleTextFieldHidden action', () => {
    const { toggleTextFieldHidden } = actions;
    it('should return a TOGGLE_TEXT_FIELD_HIDDEN action type', () => {
      const actual = toggleTextFieldHidden('my-field');
      const expected = { id: 'my-field', type: actionTypes.TOGGLE_TEXT_FIELD_HIDDEN };
      expect(actual).toEqual(expected);
    });
  });

  describe('moveTextFieldUp action', () => {
    const { moveTextFieldUp } = actions;
    it('should return a MOVE_TEXT_FIELD_UP action type', () => {
      const actual = moveTextFieldUp('my-field');
      const expected = { id: 'my-field', type: actionTypes.MOVE_TEXT_FIELD_UP };
      expect(actual).toEqual(expected);
    });
  });

  describe('moveTextFieldDown action', () => {
    const { moveTextFieldDown } = actions;
    it('should return a MOVE_TEXT_FIELD_DOWN action type', () => {
      const actual = moveTextFieldDown('my-field');
      const expected = { id: 'my-field', type: actionTypes.MOVE_TEXT_FIELD_DOWN };
      expect(actual).toEqual(expected);
    });
  });

  describe('addSelectFieldOption action', () => {
    const { addSelectFieldOption } = actions;
    it('should return a ADD_SELECT_FIELD_OPTION action type', () => {
      const actual = addSelectFieldOption('my-field', 'my-id');
      const expected = { fieldId: 'my-field', id: 'my-id', type: actionTypes.ADD_SELECT_FIELD_OPTION };
      expect(actual).toEqual(expected);
    });
  });

  describe('deleteSelectFieldOption action', () => {
    const { deleteSelectFieldOption } = actions;
    it('should return a DELETE_SELECT_FIELD_OPTION action type', () => {
      const actual = deleteSelectFieldOption('my-field', 'my-id');
      const expected = { fieldId: 'my-field', id: 'my-id', type: actionTypes.DELETE_SELECT_FIELD_OPTION };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateSelectFieldOptionLabel action', () => {
    const { updateSelectFieldOptionLabel } = actions;
    it('should return a UPDATE_SELECT_FIELD_OPTION_LABEL action type', () => {
      const actual = updateSelectFieldOptionLabel('my-field', 'my-id', 'my-locale', 'my-value');
      const expected = {
        fieldId: 'my-field',
        id: 'my-id',
        locale: 'my-locale',
        value: 'my-value',
        type: actionTypes.UPDATE_SELECT_FIELD_OPTION_LABEL
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('moveSelectFieldOptionUp action', () => {
    const { moveSelectFieldOptionUp } = actions;
    it('should return a MOVE_SELECT_FIELD_OPTION_UP action type', () => {
      const actual = moveSelectFieldOptionUp('my-field', 'my-id');
      const expected = { fieldId: 'my-field', id: 'my-id', type: actionTypes.MOVE_SELECT_FIELD_OPTION_UP };
      expect(actual).toEqual(expected);
    });
  });

  describe('moveSelectFieldOptionDown action', () => {
    const { moveSelectFieldOptionDown } = actions;
    it('should return a MOVE_SELECT_FIELD_OPTION_DOWN action type', () => {
      const actual = moveSelectFieldOptionDown('my-field', 'my-id');
      const expected = { fieldId: 'my-field', id: 'my-id', type: actionTypes.MOVE_SELECT_FIELD_OPTION_DOWN };
      expect(actual).toEqual(expected);
    });
  });
});