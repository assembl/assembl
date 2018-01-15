import * as actions from '../../../../js/app/actions/adminActions/landingPage';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('Landing page administration actions', () => {
  describe('toggleLandingPageModule action', () => {
    const { toggleLandingPageModule } = actions;
    it('should return a toggleLandingPageModule action type', () => {
      const expected = {
        moduleTypeIdentifier: 'VIDEO',
        type: actionTypes.TOGGLE_LANDING_PAGE_MODULE
      };
      const actual = toggleLandingPageModule('VIDEO');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateLandingPageModules action', () => {
    const { updateLandingPageModules } = actions;
    it('should return a updateLandingPageModules action type', () => {
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
});