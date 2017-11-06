import * as actions from '../../../../js/app/actions/adminActions/resourcesCenter';
import { CREATE_RESOURCE } from '../../../../js/app/actions/actionTypes';

describe('resourcesCenter admin actions', () => {
  describe('createResource action', () => {
    const { createResource } = actions;
    it('should return a CREATE_RESOURCE action type', () => {
      const actual = createResource('-3344789', 1);
      const expected = { id: '-3344789', order: 1, type: CREATE_RESOURCE };
      expect(actual).toEqual(expected);
    });
  });
});