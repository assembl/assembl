// @flow
import type ReduxAction from 'redux';
import * as actionTypes from '../../../js/app/actions/actionTypes';

// use null as default state to indicate the timeline is not loaded yet
export const TimelineReducer = (state: Object = null, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_TIMELINE:
    return action.timeline; // string here ?
  default:
    return state; // object here ?
  }
};

export default TimelineReducer;