// @flow
import { fromJS, List } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes';
import * as reducers from '../../../../js/app/reducers/adminReducer/adminSections';

describe('adminSections admin reducers', () => {
  describe('sectionsHaveChanged reducer', () => {
    const { sectionsHaveChanged } = reducers;
    const initialDefaultState = false;
    it('should return initial state', () => {
      const state = undefined;
      const action = {};

      const actual = sectionsHaveChanged(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = initialDefaultState;
      const action = { type: 'FOOBAR' };

      const actual = sectionsHaveChanged(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });

    [
      actionTypes.CREATE_SECTION,
      actionTypes.DELETE_SECTION,
      actionTypes.UPDATE_SECTION_URL,
      actionTypes.TOGGLE_EXTERNAL_PAGE,
      actionTypes.MOVE_UP_SECTION,
      actionTypes.MOVE_DOWN_SECTION,
      actionTypes.UPDATE_SECTION_TITLE
    ].forEach((actionType) => {
      it(`should handle ${actionType}`, () => {
        const state = initialDefaultState;
        const action = { type: actionType };

        const actual = sectionsHaveChanged(state, action);
        const expected = true;

        expect(actual).toEqual(expected);
      });
    });

    it('should handle UPDATE_SECTIONS', () => {
      const state = initialDefaultState;
      const action = {
        type: actionTypes.UPDATE_SECTIONS
      };
      const actual = sectionsHaveChanged(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });
  });

  describe('sectionsInOrder reducer', () => {
    const { sectionsInOrder } = reducers;
    it('should return initial state', () => {
      const state = undefined;
      const action = {};
      const actual = sectionsInOrder(state, action);
      const expected = List();
      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = List.of('1', '2', '3');
      const action = {
        type: 'FOOBAR'
      };
      const actual = sectionsInOrder(state, action);
      const expected = state;
      expect(actual).toEqual(expected);
    });

    it('should handle CREATE_SECTION', () => {
      const state = List.of('1', '2', '3');
      const action = {
        id: '4',
        type: actionTypes.CREATE_SECTION
      };
      const actual = sectionsInOrder(state, action);
      const expected = List.of('1', '2', '3', '4');
      expect(actual).toEqual(expected);
    });

    it('should handle DELETE_SECTION', () => {
      const state = List.of('1', '2', '3');
      const action = {
        id: '2',
        type: actionTypes.DELETE_SECTION
      };
      const actual = sectionsInOrder(state, action);
      const expected = List.of('1', '3');
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_SECTIONS', () => {
      const state = List.of('1', '2', '3');
      const action = {
        sections: [{ id: '42' }],
        type: actionTypes.UPDATE_SECTIONS
      };
      const actual = sectionsInOrder(state, action);
      const expected = List.of('42');
      expect(actual).toEqual(expected);
    });

    it('should handle MOVE_UP_SECTION', () => {
      const state = List.of('1', '2', '3');
      const action = {
        id: '2',
        type: actionTypes.MOVE_UP_SECTION
      };
      const actual = sectionsInOrder(state, action);
      const expected = List.of('2', '1', '3');
      expect(actual).toEqual(expected);
    });

    it('should handle MOVE_DOWN_SECTION', () => {
      const state = List.of('1', '2', '3');
      const action = {
        id: '2',
        type: actionTypes.MOVE_DOWN_SECTION
      };
      const actual = sectionsInOrder(state, action);
      const expected = List.of('1', '3', '2');
      expect(actual).toEqual(expected);
    });
  });

  describe('sectionsById reducer', () => {
    const { sectionsById } = reducers;
    const oldState = fromJS({
      '1': {
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        id: '1',
        order: 1,
        titleEntries: [{ localeCode: 'en', value: 'GNU' }],
        url: 'http://www.gnu.com',
        type: 'CUSTOM'
      }
    });

    it('should handle CREATE_SECTION action type', () => {
      const action = {
        id: '2',
        order: 2,
        type: actionTypes.CREATE_SECTION
      };
      const expected = fromJS({
        '1': {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          id: '1',
          order: 1,
          titleEntries: [{ localeCode: 'en', value: 'GNU' }],
          url: 'http://www.gnu.com',
          type: 'CUSTOM'
        },
        '2': {
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          titleEntries: [],
          url: '',
          type: 'CUSTOM',
          id: '2',
          order: 2
        }
      });
      const actual = sectionsById(oldState, action);
      expect(actual).toEqual(expected);
    });

    it('should handle DELETE_SECTION action type', () => {
      const action = {
        id: '1',
        type: actionTypes.DELETE_SECTION
      };
      const expected = fromJS({
        '1': {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          id: '1',
          order: 1,
          titleEntries: [{ localeCode: 'en', value: 'GNU' }],
          url: 'http://www.gnu.com',
          type: 'CUSTOM'
        }
      });
      const actual = sectionsById(oldState, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_SECTION_URL action type', () => {
      const action = {
        id: '1',
        value: 'http://www.gnu.org',
        type: actionTypes.UPDATE_SECTION_URL
      };
      const expected = fromJS({
        '1': {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          id: '1',
          order: 1,
          titleEntries: [{ localeCode: 'en', value: 'GNU' }],
          url: 'http://www.gnu.org',
          type: 'CUSTOM'
        }
      });
      const actual = sectionsById(oldState, action);
      expect(actual).toEqual(expected);
    });

    it('should handle TOGGLE_EXTERNAL_PAGE action type', () => {
      const action = {
        id: '1',
        type: actionTypes.TOGGLE_EXTERNAL_PAGE
      };
      const expected = fromJS({
        '1': {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          id: '1',
          order: 1,
          titleEntries: [{ localeCode: 'en', value: 'GNU' }],
          url: null,
          type: 'CUSTOM'
        }
      });
      const actual = sectionsById(oldState, action);
      expect(actual).toEqual(expected);

      const expected2 = fromJS({
        '1': {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          id: '1',
          order: 1,
          titleEntries: [{ localeCode: 'en', value: 'GNU' }],
          url: '',
          type: 'CUSTOM'
        }
      });
      const actual2 = sectionsById(expected, action);
      expect(actual2).toEqual(expected2);
    });

    it('should handle UPDATE_SECTION_TITLE action type', () => {
      const action = {
        id: '1',
        locale: 'en',
        value: 'GNU is not Unix',
        type: actionTypes.UPDATE_SECTION_TITLE
      };
      const expected = fromJS({
        '1': {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          id: '1',
          order: 1,
          titleEntries: [{ localeCode: 'en', value: 'GNU is not Unix' }],
          url: 'http://www.gnu.com',
          type: 'CUSTOM'
        }
      });
      const actual = sectionsById(oldState, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_SECTIONS action type', () => {
      const action = {
        sections: [
          {
            id: '2',
            order: 8,
            titleEntries: [{ localeCode: 'en', value: 'port' }],
            url: '',
            sectionType: 'HOMEPAGE'
          }
        ],
        type: actionTypes.UPDATE_SECTIONS
      };
      const expected = fromJS({
        '2': {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          id: '2',
          order: 8,
          titleEntries: [{ localeCode: 'en', value: 'port' }],
          url: '',
          type: 'HOMEPAGE'
        }
      });
      const actual = sectionsById(oldState, action);
      expect(actual).toEqual(expected);
    });
  });
});