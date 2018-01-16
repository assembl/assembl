import { Map } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes';
import * as reducers from '../../../../js/app/reducers/adminReducer/landingPage';
import { modulesByIdentifier } from '../../components/administration/landingPage/fakeData';

describe('Landing page modules reducer', () => {
  const reducer = reducers.modules;
  it('it should return the initial state', () => {
    const action = {};
    const expected = Map();
    expect(reducer(undefined, action)).toEqual(expected);
  });

  it('should return the current state for other actions', () => {
    const action = { type: 'FOOBAR' };
    const oldState = Map({
      HEADER: Map({ identifier: 'HEADER', enabled: true, order: 1.0 })
    });
    expect(reducer(oldState, action)).toEqual(oldState);
  });

  it('should handle TOGGLE_LANDING_PAGE_MODULE action type', () => {
    const action = {
      moduleTypeIdentifier: 'HEADER',
      type: actionTypes.TOGGLE_LANDING_PAGE_MODULE
    };
    const oldState = Map({
      HEADER: Map({ identifier: 'HEADER', enabled: true, order: 1.0 })
    });
    const expected = Map({
      HEADER: Map({ identifier: 'HEADER', enabled: false, order: 1.0 })
    });
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
    const twice = reducer(actual, action);
    expect(twice).toEqual(oldState);
  });

  it('should handle UPDATE_LANDING_PAGE_MODULES action type', () => {
    const action = {
      modules: modulesByIdentifier.map(v => v.toJS()).toArray(),
      type: actionTypes.UPDATE_LANDING_PAGE_MODULES
    };
    const oldState = Map();
    const expected = modulesByIdentifier;
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
  });
});

describe('Landing page modulesHasChanged reducer', () => {
  const reducer = reducers.modulesHasChanged;
  it('it should return the initial state', () => {
    const action = {};
    const expected = false;
    expect(reducer(undefined, action)).toEqual(expected);
  });

  it('should return the current state for other actions', () => {
    const action = { type: 'FOOBAR' };
    const oldState = true;
    expect(reducer(oldState, action)).toEqual(oldState);
  });

  it('should handle TOGGLE_LANDING_PAGE_MODULE action type', () => {
    const action = {
      moduleTypeIdentifier: 'HEADER',
      type: actionTypes.TOGGLE_LANDING_PAGE_MODULE
    };
    const oldState = false;
    const expected = true;
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
  });

  it('should handle UPDATE_LANDING_PAGE_MODULES action type', () => {
    const action = {
      modules: modulesByIdentifier.map(v => v.toJS()).toArray(),
      type: actionTypes.UPDATE_LANDING_PAGE_MODULES
    };
    const oldState = true;
    const expected = false;
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
  });
});