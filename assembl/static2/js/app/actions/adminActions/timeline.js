// @flow
import { type moment } from 'moment';
import * as actionTypes from '../actionTypes';

export const createPhase = (id: string): actionTypes.CreatePhase => ({
  id: id,
  type: actionTypes.CREATE_PHASE
});

export const updatePhases = (phases: actionTypes.PhasesArray): actionTypes.UpdatePhases => ({
  phases: phases,
  type: actionTypes.UPDATE_PHASES
});

export const updatePhaseTitle = (id: string, locale: string, value: string): actionTypes.UpdatePhaseTitle => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_PHASE_TITLE
});

export const updatePhaseIdentifier = (id: string, identifier: string): actionTypes.UpdatePhaseIdentifier => ({
  id: id,
  value: identifier,
  type: actionTypes.UPDATE_PHASE_IDENTIFIER
});


export const deletePhase = (id: string): actionTypes.DeletePhase => ({
  id: id,
  type: actionTypes.DELETE_PHASE
});

export const updateStartDate = (id: string, value: moment): actionTypes.UpdatePhaseStart => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_PHASE_START
});

export const updateEndDate = (id: string, value: moment): actionTypes.UpdatePhaseEnd => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_PHASE_END
});

export const updateIsThematicsTable = (id: string, value: boolean): actionTypes.UpdateIsThematicsTable => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_IS_THEMATICS_TABLE
});

export const movePhaseUp = (id: string): actionTypes.MovePhaseUp => ({
  id: id,
  type: actionTypes.MOVE_PHASE_UP
});

export const movePhaseDown = (id: string): actionTypes.MovePhaseDown => ({
  id: id,
  type: actionTypes.MOVE_PHASE_DOWN
});