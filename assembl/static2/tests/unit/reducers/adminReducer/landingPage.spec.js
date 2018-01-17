import { List, Map } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes';
import * as reducers from '../../../../js/app/reducers/adminReducer/landingPage';
import { modulesByIdentifier } from '../../components/administration/landingPage/fakeData';

describe('Landing page enabledModulesInOrder reducer', () => {
  const reducer = reducers.enabledModulesInOrder;
  it('it should return the initial state', () => {
    const action = {};
    const expected = List();
    expect(reducer(undefined, action)).toEqual(expected);
  });

  it('should return the current state for other actions', () => {
    const action = { type: 'FOOBAR' };
    const oldState = List.of('HEADER', 'INTRODUCTION', 'FOOTER');
    expect(reducer(oldState, action)).toEqual(oldState);
  });

  it('should handle TOGGLE_LANDING_PAGE_MODULE action type', () => {
    const action = {
      moduleTypeIdentifier: 'INTRODUCTION',
      type: actionTypes.TOGGLE_LANDING_PAGE_MODULE
    };
    const oldState = List.of('HEADER', 'INTRODUCTION', 'TIMELINE', 'FOOTER');
    const expected = List.of('HEADER', 'TIMELINE', 'FOOTER');
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
    const twice = reducer(actual, action);
    const twiceExpected = List.of('HEADER', 'TIMELINE', 'INTRODUCTION', 'FOOTER');
    expect(twice).toEqual(twiceExpected);
  });

  it('should handle UPDATE_LANDING_PAGE_MODULES action type', () => {
    const action = {
      modules: modulesByIdentifier.map(v => v.toJS()).toArray(),
      type: actionTypes.UPDATE_LANDING_PAGE_MODULES
    };
    const oldState = List();
    const expected = List.of('HEADER', 'VIDEO', 'FOOTER');
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
  });
});

describe('Landing page modulesByIdentifier reducer', () => {
  const reducer = reducers.modulesByIdentifier;
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