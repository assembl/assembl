import * as actions from '../../../../js/app/actions/adminActions/landingPage';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('Landing page administration actions', () => {
  describe('updateLandingPageModules action', () => {
    const { updateLandingPageModules } = actions;
    it('should return a UPDATE_LANDING_PAGE_MODULES action type', () => {
      const modules = [
        { enabled: true, moduleType: { identifier: 'HEADER' }, order: 1.0 },
        { enabled: false, moduleType: { identifier: 'VIDEO' }, order: 1.0 }
      ];
      const expected = {
        modules: modules,
        type: actionTypes.UPDATE_LANDING_PAGE_MODULES
      };
      const actual = updateLandingPageModules(modules);
      expect(actual).toEqual(expected);
    });
  });

  describe('moveLandingPageModuleUp action', () => {
    const { moveLandingPageModuleUp } = actions;
    it('should return a MOVE_LANDING_PAGE_MODULE_UP action type', () => {
      const expected = {
        id: 'abc123',
        type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
      };
      const actual = moveLandingPageModuleUp('abc123');
      expect(actual).toEqual(expected);
    });
  });

  describe('moveLandingPageModuleDown action', () => {
    const { moveLandingPageModuleDown } = actions;
    it('should return a MOVE_LANDING_PAGE_MODULE_DOWN action type', () => {
      const expected = {
        id: 'abc123',
        type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
      };
      const actual = moveLandingPageModuleDown('abc123');
      expect(actual).toEqual(expected);
    });
  });
});