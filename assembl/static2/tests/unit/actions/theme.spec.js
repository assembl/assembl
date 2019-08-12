// @flow
import * as actions from '../../../js/app/actions/themeActions';
import * as actionTypes from '../../../js/app/actions/actionTypes';

describe('Theme actions', () => {
  describe('setTheme action', () => {
    const { setTheme } = actions;

    it('should return a ADD_TEXT_FIELD action type', () => {
      const actual = setTheme('#FF0000', '#0000FF');
      const expected = {
        firstColor: '#FF0000',
        secondColor: '#0000FF',
        type: actionTypes.SET_THEME
      };
      expect(actual).toEqual(expected);
    });
  });
});