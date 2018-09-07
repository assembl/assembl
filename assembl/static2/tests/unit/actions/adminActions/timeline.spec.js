import moment from 'moment';
import * as actions from '../../../../js/app/actions/adminActions/timeline';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('Timeline administration actions', () => {
  it('should return a CREATE_PHASE action type', () => {
    const { createPhase } = actions;
    const expected = {
      id: '123', type: actionTypes.CREATE_PHASE
    };
    const actual = createPhase('123');
    expect(actual).toEqual(expected);
  });
  it('should return an UPDATE_PHASE_TITLE action type', () => {
    const { updatePhaseTitle } = actions;
    const expected = {
      id: '123', value: 'Super titre', locale: 'fr', type: actionTypes.UPDATE_PHASE_TITLE
    };
    const actual = updatePhaseTitle('123', 'fr', 'Super titre');
    expect(actual).toEqual(expected);
  });
  it('should return an UPDATE_PHASE_IDENTIFIER action type', () => {
    const { updatePhaseIdentifier } = actions;
    const expected = {
      id: '123', value: 'thread', type: actionTypes.UPDATE_PHASE_IDENTIFIER
    };
    const actual = updatePhaseIdentifier('123', 'thread');
    expect(actual).toEqual(expected);
  });
  it('should return a DELETE_PHASE action type', () => {
    const { deletePhase } = actions;
    const expected = { id: '123', type: actionTypes.DELETE_PHASE };
    const actual = deletePhase('123');
    expect(actual).toEqual(expected);
  });
  it('should return an UPDATE_PHASE_START action type', () => {
    const { updateStartDate } = actions;
    const expected = { id: '123', value: moment('2014-12-31T09:00:00+00:00'), type: actionTypes.UPDATE_PHASE_START };
    const actual = updateStartDate('123', moment('2014-12-31T09:00:00+00:00'));
    expect(actual).toEqual(expected);
  });
  it('should return an UPDATE_PHASE_END action type', () => {
    const { updateEndDate } = actions;
    const expected = { id: '123', value: moment('2014-12-31T09:00:00+00:00'), type: actionTypes.UPDATE_PHASE_END };
    const actual = updateEndDate('123', moment('2014-12-31T09:00:00+00:00'));
    expect(actual).toEqual(expected);
  });
  it('should return an UPDATE_IS_THEMATICS_TABLE action type', () => {
    const { updateIsThematicsTable } = actions;
    const expected = { id: '123', value: true, type: actionTypes.UPDATE_IS_THEMATICS_TABLE };
    const actual = updateIsThematicsTable('123', true);
    expect(actual).toEqual(expected);
  });
  it('should return an UPDATE_PHASES action type', () => {
    const { updatePhases } = actions;
    const phases = [{
      id: '123',
      identifier: 'survey',
      isThematicsTable: false,
      start: moment('2014-12-27T09:00:00+00:00'),
      end: moment('2014-12-31T09:00:00+00:00'),
      titleEntries: [{ localeCode: 'en', value: 'Cool title' }]
    }];
    const expected = { phases: phases, type: actionTypes.UPDATE_PHASES };
    const actual = updatePhases(phases);
    expect(actual).toEqual(expected);
  });
});