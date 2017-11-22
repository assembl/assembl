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