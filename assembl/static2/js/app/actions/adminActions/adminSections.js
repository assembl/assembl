// @flow
import * as actionTypes from '../actionTypes';

export const updateSections = (sections: actionTypes.SectionsArray): actionTypes.UpdateSections => {
  return {
    sections: sections,
    type: actionTypes.UPDATE_SECTIONS
  };
};