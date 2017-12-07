// @flow
import * as actionTypes from '../actionTypes';

export const updateSections = (sections: actionTypes.SectionsArray): actionTypes.UpdateSections => ({
  sections: sections,
  type: actionTypes.UPDATE_SECTIONS
});

export const updateSectionTitle = (id: string, locale: string, value: string): actionTypes.UpdateSectionTitle => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_SECTION_TITLE
});

export const updateSectionUrl = (id: string, value: string): actionTypes.UpdateSectionUrl => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_SECTION_URL
});

export const toggleExternalPage = (id: string): actionTypes.ToggleExternalPage => ({
  id: id,
  type: actionTypes.TOGGLE_EXTERNAL_PAGE
});

export const createSection = (id: string, order: number): actionTypes.CreateSection => ({
  id: id,
  order: order,
  type: actionTypes.CREATE_SECTION
});

export const deleteSection = (id: string): actionTypes.DeleteSection => ({ id: id, type: actionTypes.DELETE_SECTION });

export const moveSectionUp = (id: string): actionTypes.UpSection => ({ id: id, type: actionTypes.MOVE_UP_SECTION });

export const moveSectionDown = (id: string): actionTypes.DownSection => ({ id: id, type: actionTypes.MOVE_DOWN_SECTION });