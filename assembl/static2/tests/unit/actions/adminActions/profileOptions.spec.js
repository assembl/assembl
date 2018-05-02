import * as actions from '../../../../js/app/actions/adminActions/profileOptions';
import * as actionTypes from '../../../../js/app/actions/actionTypes/admin/profileOptions';

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
      const expected = { id: 'foobar', type: actionTypes.ADD_TEXT_FIELD };
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
});