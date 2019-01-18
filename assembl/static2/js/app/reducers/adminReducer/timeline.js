// @flow
import type ReduxAction from 'redux';
import { combineReducers } from 'redux';
import { List, Map, fromJS } from 'immutable';
import { updateInLangstringEntries } from '../../utils/i18n';
import { moveItemUp, moveItemDown } from '../../utils/globalFunctions';

import {
  type Action,
  CREATE_PHASE,
  UPDATE_PHASES,
  DELETE_PHASE,
  UPDATE_PHASE_TITLE,
  UPDATE_PHASE_DESCRIPTION,
  UPDATE_PHASE_IMAGE,
  UPDATE_PHASE_START,
  UPDATE_PHASE_END,
  MOVE_PHASE_UP,
  MOVE_PHASE_DOWN
} from '../../actions/actionTypes';

const defaultImage = Map({
  externalUrl: '',
  mimeType: '',
  title: ''
});

const emptyPhase = Map({
  _hasChanged: false,
  _isNew: true,
  _toDelete: false,
  identifier: null,
  titleEntries: List(),
  descriptionEntries: List(),
  start: null,
  end: null,
  hasConflictingDates: false,
  endIsBeforeStart: false,
  image: defaultImage
});

const hasConflictingDates = (phase, phases) => {
  const start = phase.get('start');
  const end = phase.get('end');
  const id = phase.get('id');
  const orderedPhasesMap = phases.filter(p => !p.get('_toDelete')).sortBy(p => p.get('order'));
  const phaseIndex = orderedPhasesMap.keySeq().indexOf(id);
  const phasesArray = orderedPhasesMap.valueSeq().toJS();
  const previousPhase = phasesArray[phaseIndex - 1];
  const nextPhase = phasesArray[phaseIndex + 1];
  const res = (start && previousPhase && start.isBefore(previousPhase.end)) || (end && nextPhase && end.isAfter(nextPhase.start));
  return res || false;
};

const setHasConflictingDates = (phases) => {
  let newState = phases;
  newState.forEach((phase, id) => {
    newState = newState.setIn([id, 'hasConflictingDates'], hasConflictingDates(phase, newState));
  });
  return newState;
};

type PhasesByIdState = Map<string, Map>;
type PhasesByIdReducer = (PhasesByIdState, ReduxAction<Action>) => PhasesByIdState;
export const phasesById: PhasesByIdReducer = (state: PhasesByIdState = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_PHASE:
    return state.set(action.id, emptyPhase.set('id', action.id).set('order', action.order));
  case DELETE_PHASE: {
    let newState = state.setIn([action.id, '_toDelete'], true);
    newState = setHasConflictingDates(newState);
    return newState;
  }
  case UPDATE_PHASE_TITLE:
    return state
      .updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case UPDATE_PHASE_DESCRIPTION:
    return state
      .updateIn([action.id, 'descriptionEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case UPDATE_PHASE_START: {
    const end = state.getIn([action.id, 'end']);
    const newStart = action.value;
    const endIsBeforeNewStart = end && end.isBefore(newStart);
    let newState = state
      .setIn([action.id, 'start'], newStart)
      .setIn([action.id, 'endIsBeforeStart'], endIsBeforeNewStart || false)
      .setIn([action.id, '_hasChanged'], true);
    newState = setHasConflictingDates(newState);
    return newState;
  }
  case UPDATE_PHASE_END: {
    const start = state.getIn([action.id, 'start']);
    const newEnd = action.value;
    const newIsBeforeStart = start && newEnd.isBefore(start);
    let newState = state
      .setIn([action.id, 'end'], newEnd)
      .setIn([action.id, 'endIsBeforeStart'], newIsBeforeStart || false)
      .setIn([action.id, '_hasChanged'], true);
    newState = setHasConflictingDates(newState);
    return newState;
  }
  case UPDATE_PHASE_IMAGE:
    return state
      .setIn([action.id, 'image', 'externalUrl'], action.value)
      .setIn([action.id, 'image', 'mimeType'], action.value.type)
      .setIn([action.id, 'image', 'title'], action.value.name)
      .setIn([action.id, '_hasChanged'], true);
  case MOVE_PHASE_UP: {
    let newState = moveItemUp(state, action.id);
    newState = setHasConflictingDates(newState);
    return newState;
  }
  case MOVE_PHASE_DOWN: {
    let newState = moveItemDown(state, action.id);
    newState = setHasConflictingDates(newState);
    return newState;
  }
  case UPDATE_PHASES: {
    let newState = Map();
    action.phases.forEach(({ identifier, titleEntries, start, end, id, order, image, descriptionEntries }) => {
      const phaseInfo = Map({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        identifier: identifier,
        titleEntries: fromJS(titleEntries),
        start: start,
        end: end,
        id: id,
        order: order,
        endIsBeforeStart: end.isBefore(start),
        image: image ? fromJS(image) : defaultImage,
        descriptionEntries: fromJS(descriptionEntries)
      });

      newState = newState.set(id, phaseInfo);
    });
    newState = setHasConflictingDates(newState);
    return newState;
  }
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
  case UPDATE_PHASE_DESCRIPTION:
  case UPDATE_PHASE_IMAGE:
  case UPDATE_PHASE_START:
  case UPDATE_PHASE_END:
  case MOVE_PHASE_UP:
  case MOVE_PHASE_DOWN:
    return true;
  default:
    return state;
  }
};

export default combineReducers({
  phasesHaveChanged: phasesHaveChanged,
  phasesById: phasesById
});