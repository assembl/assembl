// @flow
import type ReduxAction from 'redux';
import { combineReducers } from 'redux';
import { List, Map, fromJS } from 'immutable';
import { updateInLangstringEntries } from '../../utils/i18n';

import {
  type Action,
  CREATE_PHASE,
  UPDATE_PHASES,
  DELETE_PHASE,
  UPDATE_PHASE_TITLE,
  UPDATE_PHASE_IDENTIFIER,
  UPDATE_PHASE_START,
  UPDATE_PHASE_END
} from '../../actions/actionTypes';

const emptyPhase = Map({
  _hasChanged: false,
  _isNew: true,
  _toDelete: false,
  identifier: '',
  titleEntries: List(),
  start: '',
  end: ''
});

type PhasesByIdState = Map<string, Map>;
type PhasesByIdReducer = (PhasesByIdState, ReduxAction<Action>) => PhasesByIdState
export const phasesById: PhasesByIdReducer = (state: PhasesByIdState = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_PHASE:
    return state.set(action.id, emptyPhase.set('id', action.id));
  case DELETE_PHASE:
    return state.setIn([action.id, '_toDelete'], true);
  case UPDATE_PHASE_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_PHASE_IDENTIFIER:
    return state.setIn([action.id, 'identifier'], action.value);
  case UPDATE_PHASES: {
    let newState = Map();
    action.phases.forEach((phase) => {
      const phaseInfo = Map({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        identifier: phase.identifier,
        titleEntries: fromJS(phase.titleEntries),
        start: phase.start,
        end: phase.end
      });

      newState = newState.set(phase.id, phaseInfo);
    });

    return newState;
  }
  case UPDATE_PHASE_START:
  case UPDATE_PHASE_END:
  default:
    return state;
  }
};

type PhasesInOrderState = List<string>;
type PhasesInOrderReducer = (PhasesInOrderState, ReduxAction<Action>) => PhasesInOrderState;
export const phasesInOrder: PhasesInOrderReducer = (state = List(), action) => {
  switch (action.type) {
  case CREATE_PHASE:
    return state.push(action.id);
  case UPDATE_PHASES:
    return List(action.phases.map(phase => phase.id));
  default:
    return state;
  }
};

type TimelineHasChangedReducer = (boolean, ReduxAction<Action>) => boolean;
export const phasesHaveChanged: TimelineHasChangedReducer = (state = false, action) => {
  switch (action.type) {
  case UPDATE_PHASES:
    return false;
  case CREATE_PHASE:
  case DELETE_PHASE:
  case UPDATE_PHASE_TITLE:
  case UPDATE_PHASE_IDENTIFIER:
  case UPDATE_PHASE_START:
  case UPDATE_PHASE_END:
    return true;
  default:
    return state;
  }
};

export default combineReducers({
  phasesInOrder: phasesInOrder,
  phasesHaveChanged: phasesHaveChanged,
  phasesById: phasesById
});