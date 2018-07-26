// @flow
import * as actionTypes from '../actionTypes';

type toggleLandingPageModuleAction = string => actionTypes.toggleLandingPageModule;
export const toggleLandingPageModule: toggleLandingPageModuleAction = id => ({
  id: id,
  type: actionTypes.TOGGLE_LANDING_PAGE_MODULE
});

type updateLandingPageModulesAction = actionTypes.LandingPageModules => actionTypes.UpdateLandingPageModules;
export const updateLandingPageModules: updateLandingPageModulesAction = modules => ({
  modules: modules,
  type: actionTypes.UPDATE_LANDING_PAGE_MODULES
});

type moveLandingPageModuleUpAction = string => actionTypes.MoveLandingPageModuleUp;
export const moveLandingPageModuleUp: moveLandingPageModuleUpAction = id => ({
  id: id,
  type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
});

type moveLandingPageModuleDownAction = string => actionTypes.MoveLandingPageModuleDown;
export const moveLandingPageModuleDown: moveLandingPageModuleDownAction = id => ({
  id: id,
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

export const updateLandingPageModuleTitle = (
  id: string,
  locale: string,
  value: string
): actionTypes.UpdateLandingPageModuleTitle => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_LANDING_PAGE_MODULE_TITLE
});

export const updateLandingPageModuleSubtitle = (
  id: string,
  locale: string,
  value: string
): actionTypes.UpdateLandingPageModuleSubtitle => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_LANDING_PAGE_MODULE_SUBTITLE
});

export const createLandingPageModules = (
  id: string,
  identifier: string,
  order: number
): actionTypes.CreateLandingPageModules => ({
  id: id,
  identifier: identifier,
  order: order,
  type: actionTypes.CREATE_LANDING_PAGE_MODULE
});