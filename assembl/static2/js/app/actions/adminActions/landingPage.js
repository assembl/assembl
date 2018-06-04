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

type moveLandingPageModuleUpAction = string => actionTypes.MoveLandingPageModuleUp;
export const moveLandingPageModuleUp: moveLandingPageModuleUpAction = moduleTypeIdentifier => ({
  moduleTypeIdentifier: moduleTypeIdentifier,
  type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
});

type moveLandingPageModuleDownAction = string => actionTypes.MoveLandingPageModuleDown;
export const moveLandingPageModuleDown: moveLandingPageModuleDownAction = moduleTypeIdentifier => ({
  moduleTypeIdentifier: moduleTypeIdentifier,
  type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
});

type updateLandingPageAction = actionTypes.LandingPage => actionTypes.UpdateLandingPage;
export const updateLandingPage: updateLandingPageAction = landingPage => ({
  page: landingPage,
  type: actionTypes.UPDATE_LANDING_PAGE
});

export const updateLandingPageHeaderTitle = (locale: string, value: string): actionTypes.UpdateLandingPageHeaderTitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_LANDING_PAGE_HEADER_TITLE
});

export const updateLandingPageHeaderSubtitle = (locale: string, value: string): actionTypes.UpdateLandingPageHeaderSubtitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_LANDING_PAGE_HEADER_SUBTITLE
});

export const updateLandingPageHeaderButtonLabel = (
  locale: string,
  value: string
): actionTypes.UpdateLandingPageHeaderButtonLabel => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_LANDING_PAGE_HEADER_BUTTON_LABEL
});

export const updateLandingPageHeaderImage = (value: File): actionTypes.UpdateLandingPageHeaderImage => ({
  value: value,
  type: actionTypes.UPDATE_LANDING_PAGE_HEADER_IMAGE
});

export const updateLandingPageHeaderLogo = (value: File): actionTypes.UpdateLandingPageHeaderLogo => ({
  value: value,
  type: actionTypes.UPDATE_LANDING_PAGE_HEADER_LOGO
});