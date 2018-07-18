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
  UPDATE_PHASE_IDENTIFIER,
  UPDATE_PHASE_IMAGE,
  UPDATE_PHASE_START,
  UPDATE_PHASE_END,
  UPDATE_IS_THEMATICS_TABLE,
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
  isThematicsTable: false,
  hasConflictingDates: false,
  endIsBeforeStart: false,
  image: defaultImage
});

const getHasConflictingDates = (phases, id, start, end) => {
  const phaseIndex = phases.map(p => p.id).indexOf(id);
  const previousPhase = phases[phaseIndex - 1];
  const nextPhase = phases[phaseIndex + 1];
  return (start && previousPhase && start.isBefore(previousPhase.end)) || (end && nextPhase && end.isAfter(nextPhase.start));
};

type PhasesByIdState = Map<string, Map>;
type PhasesByIdReducer = (PhasesByIdState, ReduxAction<Action>) => PhasesByIdState;
export const phasesById: PhasesByIdReducer = (state: PhasesByIdState = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_PHASE:
    return state.set(action.id, emptyPhase.set('id', action.id).set('order', action.order).set('identifier', 'survey'));
  case DELETE_PHASE:
    return state.setIn([action.id, '_toDelete'], true);
  case UPDATE_PHASE_TITLE:
    return state
      .updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case UPDATE_PHASE_DESCRIPTION:
    return state
      .updateIn([action.id, 'descriptionEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case UPDATE_PHASE_IDENTIFIER:
    return state.setIn([action.id, 'identifier'], action.value).setIn([action.id, '_hasChanged'], true);
  case UPDATE_PHASE_START: {
    const end = state.getIn([action.id, 'end']);
    const newStart = action.value;
    const endIsBeforeNewStart = end && end.isBefore(newStart);
    return state
      .setIn([action.id, 'start'], newStart)
      .setIn([action.id, 'endIsBeforeStart'], endIsBeforeNewStart || false)
      .setIn([action.id, '_hasChanged'], true);
  }
  case UPDATE_PHASE_END: {
    const start = state.getIn([action.id, 'start']);
    const newEnd = action.value;
    const newIsBeforeStart = start && newEnd.isBefore(start);
    return state
      .setIn([action.id, 'end'], newEnd)
      .setIn([action.id, 'endIsBeforeStart'], newIsBeforeStart || false)
      .setIn([action.id, '_hasChanged'], true);
  }
  case UPDATE_PHASE_IMAGE:
    return state
      .setIn([action.id, 'image', 'externalUrl'], action.value)
      .setIn([action.id, 'image', 'mimeType'], action.value.type)
      .setIn([action.id, 'image', 'title'], action.value.name)
      .setIn([action.id, '_hasChanged'], true);
  case UPDATE_IS_THEMATICS_TABLE:
    return state.setIn([action.id, 'isThematicsTable'], action.value).setIn([action.id, '_hasChanged'], true);
  case MOVE_PHASE_UP:
    return moveItemUp(state, action.id);
  case MOVE_PHASE_DOWN:
    return moveItemDown(state, action.id);
  case UPDATE_PHASES: {
    let newState = Map();
    action.phases.forEach(
      ({ identifier, titleEntries, start, end, id, isThematicsTable, order, image, descriptionEntries }) => {
        const phaseInfo = Map({
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          identifier: identifier,
          titleEntries: fromJS(titleEntries),
          start: start,
          end: end,
          isThematicsTable: isThematicsTable || false, // default to false until we have the interface to set a thematicstable
          id: id,
          order: order,
          hasConflictingDates: getHasConflictingDates(action.phases, id, start, end) || false,
          endIsBeforeStart: end.isBefore(start),
          image: image ? fromJS(image) : defaultImage,
          descriptionEntries: fromJS(descriptionEntries)
        });

        newState = newState.set(id, phaseInfo);
      }
    );

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
  case UPDATE_PHASE_IDENTIFIER:
  case UPDATE_PHASE_IMAGE:
  case UPDATE_PHASE_START:
  case UPDATE_PHASE_END:
  case UPDATE_IS_THEMATICS_TABLE:
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