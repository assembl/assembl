import * as actions from '../../../../js/app/actions/adminActions/landingPage';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('Landing page administration actions', () => {
  describe('toggleLandingPageModule action', () => {
    const { toggleLandingPageModule } = actions;
    it('should return a TOGGLE_LANDING_PAGE_MODULE action type', () => {
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
        moduleTypeIdentifier: 'VIDEO',
        type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
      };
      const actual = moveLandingPageModuleUp('VIDEO');
      expect(actual).toEqual(expected);
    });
  });

  describe('moveLandingPageModuleDown action', () => {
    const { moveLandingPageModuleDown } = actions;
    it('should return a MOVE_LANDING_PAGE_MODULE_DOWN action type', () => {
      const expected = {
        moduleTypeIdentifier: 'VIDEO',
        type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
      };
      const actual = moveLandingPageModuleDown('VIDEO');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateLandingPageHeaderTitle action', () => {
    const { updateLandingPageHeaderTitle } = actions;
    it('should return an UPDATE_LANDING_PAGE_HEADER_TITLE action type', () => {
      const actual = updateLandingPageHeaderTitle('en', 'new value');
      const expected = {
        locale: 'en',
        value: 'new value',
        type: actionTypes.UPDATE_LANDING_PAGE_HEADER_TITLE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateLandingPageHeaderSubtitle action', () => {
    const { updateLandingPageHeaderSubtitle } = actions;
    it('should return an UPDATE_LANDING_PAGE_HEADER_SUBTITLE action type', () => {
      const actual = updateLandingPageHeaderSubtitle('en', 'new value');
      const expected = {
        locale: 'en',
        value: 'new value',
        type: actionTypes.UPDATE_LANDING_PAGE_HEADER_SUBTITLE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateLandingPageHeaderButtonLabel action', () => {
    const { updateLandingPageHeaderButtonLabel } = actions;
    it('should return an UPDATE_LANDING_PAGE_HEADER_BUTTON_LABEL action type', () => {
      const actual = updateLandingPageHeaderButtonLabel('en', 'new value');
      const expected = {
        locale: 'en',
        value: 'new value',
        type: actionTypes.UPDATE_LANDING_PAGE_HEADER_BUTTON_LABEL
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateLandingPageHeaderImage action', () => {
    const { updateLandingPageHeaderImage } = actions;
    it('should return an UPDATE_LANDING_PAGE_HEADER_IMAGE action type', () => {
      const actual = updateLandingPageHeaderImage({ name: 'foo.jpg', type: 'image/jpeg' });
      const expected = {
        value: { name: 'foo.jpg', type: 'image/jpeg' },
        type: actionTypes.UPDATE_LANDING_PAGE_HEADER_IMAGE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateLandingPageHeaderLogo action', () => {
    const { updateLandingPageHeaderLogo } = actions;
    it('should return an UPDATE_LANDING_PAGE_HEADER_LOGO action type', () => {
      const actual = updateLandingPageHeaderLogo({ name: 'foo.jpg', type: 'image/jpeg' });
      const expected = {
        value: { name: 'foo.jpg', type: 'image/jpeg' },
        type: actionTypes.UPDATE_LANDING_PAGE_HEADER_LOGO
      };
      expect(actual).toEqual(expected);
    });
  });
});