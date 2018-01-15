// @flow
import * as actionTypes from '../actionTypes';

type toggleLandingPageModuleAction = string => actionTypes.toggleLandingPageModule;
export const toggleLandingPageModule: toggleLandingPageModuleAction = moduleTypeIdentifier => ({
  moduleTypeIdentifier: moduleTypeIdentifier,
  type: actionTypes.TOGGLE_LANDING_PAGE_MODULE
});

type updateLandingPageModulesAction = actionTypes.LandingPageModules => actionTypes.UpdateLandingPageModules;
export const updateLandingPageModules: updateLandingPageModulesAction = modules => ({
  modules: modules,
  type: actionTypes.UPDATE_LANDING_PAGE_MODULES
});