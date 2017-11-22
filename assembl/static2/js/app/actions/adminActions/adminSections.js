// @flow
import * as actionTypes from '../actionTypes';

export const updateSections = (sections: actionTypes.SectionsArray): actionTypes.UpdateSections => {
  return {
    sections: sections,
    type: actionTypes.UPDATE_SECTIONS
  };
};

export const updateSectionTitle = (id: string, locale: string, value: string): actionTypes.UpdateSectionTitle => {
  return {
    id: id,
    locale: locale,
    value: value,
    type: actionTypes.UPDATE_SECTION_TITLE
  };
};

export const updateSectionUrl = (id: string, value: string): actionTypes.UpdateSectionUrl => {
  return {
    id: id,
    value: value,
    type: actionTypes.UPDATE_SECTION_URL
  };
};

export const toggleExternalPage = (id: string): actionTypes.ToggleExternalPage => {
  return { id: id, type: actionTypes.TOGGLE_EXTERNAL_PAGE };
};

export const createSection = (id: string, order: number): actionTypes.CreateSection => {
  return { id: id, order: order, type: actionTypes.CREATE_SECTION };
};