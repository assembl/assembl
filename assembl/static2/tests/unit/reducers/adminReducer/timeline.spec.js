/* eslint-disable quote-props */
import moment from 'moment';
import { fromJS, List, Map } from 'immutable';
import * as actionTypes from '../../../../js/app/actions/actionTypes';
import * as reducers from '../../../../js/app/reducers/adminReducer/timeline';

describe('Timeline PhasesByIdReducer', () => {
  const { phasesById } = reducers;
  const oldState = fromJS({
    1: {
      _hasChanged: false,
      _isNew: false,
      _toDelete: false,
      id: '1',
      identifier: 'survey',
      titleEntries: fromJS([{ locale: 'fr', value: 'Titre de la phase' }]),
      descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
      start: moment('2014-12-27T09:00:00+00:00'),
      end: moment('2014-12-31T09:00:00+00:00'),
      isThematicsTable: false,
      order: 1,
      hasConflictingDates: false,
      endIsBeforeStart: false,
      image: Map({ externalUrl: '', mimeType: '', title: '' })
    }
  });
  it('should return the current state for any other action', () => {
    const action = { type: 'LUIS SUAREZ' };
    const actual = phasesById(oldState, action);
    const expected = oldState;
    expect(actual).toEqual(expected);
  });
  it('should handle CREATE_PHASE', () => {
    const action = { id: '2', order: 2, type: actionTypes.CREATE_PHASE };
    const actual = phasesById(oldState, action);
    const expected = fromJS({
      1: {
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        id: '1',
        identifier: 'survey',
        titleEntries: fromJS([{ locale: 'fr', value: 'Titre de la phase' }]),
        descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
        start: moment('2014-12-27T09:00:00+00:00'),
        end: moment('2014-12-31T09:00:00+00:00'),
        isThematicsTable: false,
        order: 1,
        hasConflictingDates: false,
        endIsBeforeStart: false,
        image: Map({ externalUrl: '', mimeType: '', title: '' })
      },
      2: {
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '2',
        identifier: 'survey',
        titleEntries: List(),
        descriptionEntries: List(),
        start: null,
        end: null,
        isThematicsTable: false,
        order: 2,
        hasConflictingDates: false,
        endIsBeforeStart: false,
        image: Map({ externalUrl: '', mimeType: '', title: '' })
      }
    });
    expect(actual).toEqual(expected);
  });
  it('should handle DELETE PHASE', () => {
    const action = { id: '1', type: actionTypes.DELETE_PHASE };
    const actual = phasesById(oldState, action);
    const expected = fromJS({
      1: {
        _hasChanged: false,
        _isNew: false,
        _toDelete: true,
        id: '1',
        identifier: 'survey',
        titleEntries: fromJS([{ locale: 'fr', value: 'Titre de la phase' }]),
        descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
        start: moment('2014-12-27T09:00:00+00:00'),
        end: moment('2014-12-31T09:00:00+00:00'),
        isThematicsTable: false,
        order: 1,
        hasConflictingDates: false,
        endIsBeforeStart: false,
        image: Map({ externalUrl: '', mimeType: '', title: '' })
      }
    });
    expect(actual).toEqual(expected);
  });
  it('should handle UPDATE_PHASE_TITLE', () => {
    const action = { id: '1', localeCode: 'fr', value: 'Nouveau titre', type: actionTypes.UPDATE_PHASE_TITLE };
    const actual = phasesById(oldState, action);
    const expected = fromJS({
      1: {
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        id: '1',
        identifier: 'survey',
        titleEntries: fromJS([{ locale: 'fr', value: 'Nouveau titre' }]),
        descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
        start: moment('2014-12-27T09:00:00+00:00'),
        end: moment('2014-12-31T09:00:00+00:00'),
        isThematicsTable: false,
        order: 1,
        hasConflictingDates: false,
        endIsBeforeStart: false,
        image: Map({ externalUrl: '', mimeType: '', title: '' })
      }
    });
    expect(actual).toEqual(expected);
  });
  it('should handle UPDATE_PHASE_IDENTIFIER', () => {
    const action = { id: '1', value: 'thread', type: actionTypes.UPDATE_PHASE_IDENTIFIER };
    const actual = phasesById(oldState, action);
    const expected = fromJS({
      1: {
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        id: '1',
        identifier: 'thread',
        titleEntries: [{ locale: 'fr', value: 'Titre de la phase' }],
        descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
        start: moment('2014-12-27T09:00:00+00:00'),
        end: moment('2014-12-31T09:00:00+00:00'),
        isThematicsTable: false,
        order: 1,
        hasConflictingDates: false,
        endIsBeforeStart: false,
        image: Map({ externalUrl: '', mimeType: '', title: '' })
      }
    });
    expect(actual).toEqual(expected);
  });
  it('should handle UPDATE_PHASE_START', () => {
    const action = { id: '1', value: moment('2014-12-28T09:00:00+00:00'), type: actionTypes.UPDATE_PHASE_START };
    const actual = phasesById(oldState, action);
    const expected = fromJS({
      1: {
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        id: '1',
        identifier: 'survey',
        titleEntries: fromJS([{ locale: 'fr', value: 'Titre de la phase' }]),
        descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
        start: moment('2014-12-28T09:00:00+00:00'),
        end: moment('2014-12-31T09:00:00+00:00'),
        isThematicsTable: false,
        order: 1,
        hasConflictingDates: false,
        endIsBeforeStart: false,
        image: Map({ externalUrl: '', mimeType: '', title: '' })
      }
    });
    expect(actual).toEqual(expected);
  });
  it('should handle UPDATE_PHASE_END', () => {
    const action = { id: '1', value: moment('2023-12-31T09:00:00+00:00'), type: actionTypes.UPDATE_PHASE_END };
    const actual = phasesById(oldState, action);
    const expected = fromJS({
      1: {
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        id: '1',
        identifier: 'survey',
        titleEntries: [{ locale: 'fr', value: 'Titre de la phase' }],
        descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
        start: moment('2014-12-27T09:00:00+00:00'),
        end: moment('2023-12-31T09:00:00+00:00'),
        isThematicsTable: false,
        order: 1,
        hasConflictingDates: false,
        endIsBeforeStart: false,
        image: Map({ externalUrl: '', mimeType: '', title: '' })
      }
    });
    expect(actual).toEqual(expected);
  });
  it('should handle UPDATE_IS_THEMATICS_TABLE', () => {
    const action = { id: '1', value: true, type: actionTypes.UPDATE_IS_THEMATICS_TABLE };
    const actual = phasesById(oldState, action);
    const expected = fromJS({
      1: {
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        id: '1',
        identifier: 'survey',
        titleEntries: [{ locale: 'fr', value: 'Titre de la phase' }],
        descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
        start: moment('2014-12-27T09:00:00+00:00'),
        end: moment('2014-12-31T09:00:00+00:00'),
        isThematicsTable: true,
        order: 1,
        hasConflictingDates: false,
        endIsBeforeStart: false,
        image: Map({ externalUrl: '', mimeType: '', title: '' })
      }
    });
    expect(actual).toEqual(expected);
  });
  it('should handle UPDATE_PHASES', () => {
    const action = {
      phases: [
        {
          id: '2',
          identifier: 'voteSession',
          titleEntries: [{ locale: 'fr', value: 'Titre de la phase' }],
          descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
          start: moment('2014-12-28T09:00:00+00:00'),
          end: moment('2023-12-31T09:00:00+00:00'),
          isThematicsTable: false,
          order: 1,
          hasConflictingDates: false,
          endIsBeforeStart: false,
          image: Map({ externalUrl: '', mimeType: '', title: '' })
        }
      ],
      type: actionTypes.UPDATE_PHASES
    };
    const actual = phasesById(oldState, action);
    const expected = fromJS({
      2: {
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        id: '2',
        identifier: 'voteSession',
        titleEntries: [{ locale: 'fr', value: 'Titre de la phase' }],
        descriptionEntries: fromJS([{ locale: 'fr', value: 'Description de la phase' }]),
        start: moment('2014-12-28T09:00:00+00:00'),
        end: moment('2023-12-31T09:00:00+00:00'),
        isThematicsTable: false,
        order: 1,
        hasConflictingDates: false,
        endIsBeforeStart: false,
        image: Map({ externalUrl: '', mimeType: '', title: '' })
      }
    });
    expect(actual).toEqual(expected);
  });
});