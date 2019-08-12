import { List, Map } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes';
import * as reducers from '../../../../js/app/reducers/adminReducer/landingPage';
import { modulesByIdData } from '../../components/administration/landingPage/fakeData';

describe('landingPage admin reducers', () => {
  describe('modulesHasChanged reducer', () => {
    const { modulesHasChanged } = reducers;
    const initialDefaultState = false;
    it('it should return the initial state', () => {
      const state = undefined;
      const action = {};

      const actual = modulesHasChanged(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = initialDefaultState;
      const action = { type: 'FOOBAR' };

      const actual = modulesHasChanged(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });

    [
      actionTypes.CREATE_LANDING_PAGE_MODULE,
      actionTypes.MOVE_LANDING_PAGE_MODULE_UP,
      actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN,
      actionTypes.TOGGLE_LANDING_PAGE_MODULE
    ].forEach((actionType) => {
      it(`should handle ${actionType}`, () => {
        const state = initialDefaultState;
        const action = { type: actionType };

        const actual = modulesHasChanged(state, action);
        const expected = true;

        expect(actual).toEqual(expected);
      });
    });

    it('should handle UPDATE_LANDING_PAGE_MODULES', () => {
      const state = initialDefaultState;
      const action = {
        type: actionTypes.UPDATE_LANDING_PAGE_MODULES
      };

      const actual = modulesHasChanged(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });
  });

  describe('modulesInOrder reducer', () => {
    const { modulesInOrder } = reducers;
    const initialDefaultState = List.of('HEADER', 'INTRODUCTION', 'CONTENT', 'FOOTER');

    it('it should return the initial state', () => {
      const state = undefined;
      const action = {};

      const actual = modulesInOrder(state, action);
      const expected = List();

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = initialDefaultState;
      const action = { type: 'FOOBAR' };

      const actual = modulesInOrder(state, action);
      const expected = state;

      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_LANDING_PAGE_MODULES', () => {
      const state = initialDefaultState;
      const action = {
        modules: [{ id: 'module-1' }, { id: 'module-2' }],
        type: actionTypes.UPDATE_LANDING_PAGE_MODULES
      };

      const actual = modulesInOrder(state, action);
      const expected = List.of('module-1', 'module-2');

      expect(actual).toEqual(expected);
    });

    it('should handle CREATE_LANDING_PAGE_MODULE', () => {
      const state = initialDefaultState;
      const action = {
        id: 'MODULE',
        type: actionTypes.CREATE_LANDING_PAGE_MODULE
      };

      const actual = modulesInOrder(state, action);
      const expected = List.of('HEADER', 'INTRODUCTION', 'CONTENT', 'MODULE', 'FOOTER');

      expect(actual).toEqual(expected);
    });
  });

  describe('enabledModulesInOrder reducer', () => {
    const { enabledModulesInOrder } = reducers;
    const initialDefaultState = List.of('HEADER', 'INTRODUCTION', 'CONTENT', 'FOOTER');

    it('it should return the initial state', () => {
      const state = undefined;
      const action = {};

      const actual = enabledModulesInOrder(state, action);
      const expected = List();

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = initialDefaultState;
      const action = { type: 'FOOBAR' };

      const actual = enabledModulesInOrder(state, action);
      const expected = state;

      expect(actual).toEqual(expected);
    });

    it('should handle CREATE_LANDING_PAGE_MODULE', () => {
      const state = initialDefaultState;
      const action = {
        id: 'MODULE',
        type: actionTypes.CREATE_LANDING_PAGE_MODULE
      };

      const actual = enabledModulesInOrder(state, action);
      const expected = List.of('HEADER', 'INTRODUCTION', 'CONTENT', 'MODULE', 'FOOTER');

      expect(actual).toEqual(expected);
    });

    it('should handle MOVE_LANDING_PAGE_MODULE_UP', () => {
      const state = initialDefaultState;
      const action = {
        id: 'CONTENT',
        type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
      };

      const actual = enabledModulesInOrder(state, action);
      const expected = List.of('HEADER', 'CONTENT', 'INTRODUCTION', 'FOOTER');

      expect(actual).toEqual(expected);
    });

    it('should handle MOVE_LANDING_PAGE_MODULE_UP when module is right after HEADER', () => {
      const state = initialDefaultState;
      const action = {
        id: 'INTRODUCTION',
        type: 'MOVE_LANDING_PAGE_MODULE_UP'
      };

      const actual = enabledModulesInOrder(state, action);
      const expected = List.of('HEADER', 'INTRODUCTION', 'CONTENT', 'FOOTER');

      expect(actual).toEqual(expected);
    });

    it('should handle MOVE_LANDING_PAGE_MODULE_DOWN', () => {
      const state = initialDefaultState;
      const action = {
        id: 'INTRODUCTION',
        type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
      };

      const actual = enabledModulesInOrder(state, action);
      const expected = List.of('HEADER', 'CONTENT', 'INTRODUCTION', 'FOOTER');

      expect(actual).toEqual(expected);
    });

    it('should handle MOVE_LANDING_PAGE_MODULE_DOWN when module is right before FOOTER', () => {
      const state = initialDefaultState;
      const action = {
        id: 'CONTENT',
        type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
      };

      const actual = enabledModulesInOrder(state, action);
      const expected = List.of('HEADER', 'INTRODUCTION', 'CONTENT', 'FOOTER');

      expect(actual).toEqual(expected);
    });

    it('should handle TOGGLE_LANDING_PAGE_MODULE', () => {
      const state = initialDefaultState;
      const action = {
        id: 'CONTENT',
        type: 'TOGGLE_LANDING_PAGE_MODULE'
      };

      let actual = enabledModulesInOrder(state, action);
      let expected = List.of('HEADER', 'INTRODUCTION', 'FOOTER');
      expect(actual).toEqual(expected);

      actual = enabledModulesInOrder(actual, action);
      expected = state;
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_LANDING_PAGE_MODULES', () => {
      const state = List();
      const action = {
        modules: modulesByIdData.map(v => v.toJS()).toArray(),
        type: actionTypes.UPDATE_LANDING_PAGE_MODULES
      };

      const actual = enabledModulesInOrder(state, action);
      const expected = List.of('abc123', 'ghi789', 'jkl865');
      expect(actual).toEqual(expected);
    });
  });

  describe('modulesById reducer', () => {
    const { modulesById } = reducers;
    const initialDefaultState = Map({
      abc123: Map({ identifier: 'HEADER', enabled: false, order: 1.0, id: 'abc123', _hasChanged: true })
    });

    it('it should return the initial state', () => {
      const state = undefined;
      const action = {};

      const actual = modulesById(state, action);
      const expected = Map();

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = initialDefaultState;
      const action = { type: 'FOOBAR' };

      const actual = modulesById(state, action);
      const expected = state;

      expect(actual).toEqual(expected);
    });

    it('should handle CREATE_LANDING_PAGE_MODULE', () => {
      const state = initialDefaultState;
      const action = {
        id: 'CONTENT',
        type: actionTypes.CREATE_LANDING_PAGE_MODULE
      };

      const actual = modulesById(state, action);
      const expected = Map({
        abc123: Map({ identifier: 'HEADER', enabled: false, order: 1, id: 'abc123', _hasChanged: true }),
        CONTENT: Map({
          _toDelete: false,
          _hasChanged: false,
          enabled: true,
          existsInDatabase: false,
          moduleType: Map({
            editableOrder: true,
            required: false,
            moduleId: 'CONTENT',
            identifier: undefined,
            title: 'undefined undefined'
          }),
          order: undefined,
          id: 'CONTENT'
        })
      });
      expect(actual).toEqual(expected);
    });

    it('should handle TOGGLE_LANDING_PAGE_MODULE', () => {
      const action = {
        id: 'abc123',
        type: actionTypes.TOGGLE_LANDING_PAGE_MODULE
      };
      const oldState = initialDefaultState;
      const expected = Map({
        abc123: Map({ identifier: 'HEADER', enabled: true, order: 1.0, id: 'abc123', _hasChanged: true })
      });
      const actual = modulesById(oldState, action);
      expect(actual).toEqual(expected);
      const twice = modulesById(actual, action);
      expect(twice).toEqual(oldState);
    });

    it('should handle MOVE_LANDING_PAGE_MODULE_UP', () => {
      const state = initialDefaultState;
      const action = {
        id: 'abc123',
        type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
      };

      const actual = modulesById(state, action);
      const expected = state;

      expect(actual).toEqual(expected);
    });

    it('should handle MOVE_LANDING_PAGE_MODULE_DOWN', () => {
      const state = initialDefaultState;
      const action = {
        id: 'abc123',
        type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
      };

      const actual = modulesById(state, action);
      const expected = state;

      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_LANDING_PAGE_MODULES', () => {
      const action = {
        modules: modulesByIdData.map(v => v.toJS()).toArray(),
        type: actionTypes.UPDATE_LANDING_PAGE_MODULES
      };
      const oldState = Map();
      const expected = modulesByIdData;
      const actual = modulesById(oldState, action);
      expect(actual).toEqual(expected);
    });
  });
});