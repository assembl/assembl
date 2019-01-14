// @flow
import { type moment } from 'moment';
import * as actionTypes from '../actionTypes';

export const createPhase = (id: string, order: number): actionTypes.CreatePhase => ({
  id: id,
  order: order,
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

export const updatePhaseDescription = (id: string, locale: string, value: string): actionTypes.UpdatePhaseDescription => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_PHASE_DESCRIPTION
});

export const updatePhaseImage = (id: string, value: File): actionTypes.UpdatePhaseImage => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_PHASE_IMAGE
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

export const movePhaseUp = (id: string): actionTypes.MovePhaseUp => ({
  id: id,
  type: actionTypes.MOVE_PHASE_UP
});

export const movePhaseDown = (id: string): actionTypes.MovePhaseDown => ({
  id: id,
  type: actionTypes.MOVE_PHASE_DOWN
});