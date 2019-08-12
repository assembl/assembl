// @flow
import * as actionTypes from './actionTypes';

export const updateTimeline = (timeline: string) => ({
  timeline: timeline,
  type: actionTypes.UPDATE_TIMELINE
});