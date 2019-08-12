// @flow
import * as actionTypes from '../actionTypes';

export const toggleLandingPageModule = (id: string) => ({
  id: id,
  type: actionTypes.TOGGLE_LANDING_PAGE_MODULE
});

export const updateLandingPageModules = (modules: any) => ({
  modules: modules,
  type: actionTypes.UPDATE_LANDING_PAGE_MODULES
});

export const moveLandingPageModuleUp = (id: string) => ({
  id: id,
  type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
});

export const moveLandingPageModuleDown = (id: string) => ({
  id: id,
  type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
});

export const createLandingPageModule = (
  id: string,
  identifier: string,
  numberOfDuplicatesModules: number,
  title: string,
  order: number
) => ({
  id: id,
  identifier: identifier,
  numberOfDuplicatesModules: numberOfDuplicatesModules,
  title: title,
  order: order,
  type: actionTypes.CREATE_LANDING_PAGE_MODULE
});