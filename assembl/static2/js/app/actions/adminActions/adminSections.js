// @flow
import * as actionTypes from '../actionTypes';

// Type definition
type SectionInfo = { id: string };

export const updateSections = (sections: Array<SectionInfo>) => ({
  sections: sections,
  type: actionTypes.UPDATE_SECTIONS
});

export const updateSectionTitle = (id: string, locale: string, value: string) => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_SECTION_TITLE
});

export const updateSectionUrl = (id: string, value: string) => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_SECTION_URL
});

export const toggleExternalPage = (id: string) => ({
  id: id,
  type: actionTypes.TOGGLE_EXTERNAL_PAGE
});

export const createSection = (id: string, order: number) => ({
  id: id,
  order: order,
  type: actionTypes.CREATE_SECTION
});

export const deleteSection = (id: string) => ({
  id: id,
  type: actionTypes.DELETE_SECTION
});

export const moveSectionUp = (id: string) => ({
  id: id,
  type: actionTypes.MOVE_UP_SECTION
});

export const moveSectionDown = (id: string) => ({
  id: id,
  type: actionTypes.MOVE_DOWN_SECTION
});