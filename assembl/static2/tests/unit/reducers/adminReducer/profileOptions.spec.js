import { List, Map } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes';
import * as reducers from '../../../../js/app/reducers/adminReducer/profileOptions';

describe('profileOptions admin reducers', () => {
  describe('profileOptionsHasChanged reducer', () => {
    const { profileOptionsHasChanged } = reducers;
    const initialDefaultState = false;

    it('should return initial state', () => {
      const state = undefined;
      const action = {};

      const actual = profileOptionsHasChanged(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = initialDefaultState;
      const action = { type: 'FOOBAR' };

      const actual = profileOptionsHasChanged(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });

    [
      actionTypes.ADD_TEXT_FIELD,
      actionTypes.DELETE_TEXT_FIELD,
      actionTypes.UPDATE_TEXT_FIELD_TITLE,
      actionTypes.TOGGLE_TEXT_FIELD_REQUIRED,
      actionTypes.MOVE_TEXT_FIELD_DOWN,
      actionTypes.MOVE_TEXT_FIELD_UP,
      actionTypes.ADD_SELECT_FIELD_OPTION,
      actionTypes.DELETE_SELECT_FIELD_OPTION,
      actionTypes.UPDATE_SELECT_FIELD_OPTION_LABEL,
      actionTypes.MOVE_SELECT_FIELD_OPTION_UP,
      actionTypes.MOVE_SELECT_FIELD_OPTION_DOWN,
      actionTypes.TOGGLE_TEXT_FIELD_HIDDEN
    ].forEach((actionType) => {
      it(`should handle ${actionType}`, () => {
        const state = initialDefaultState;
        const action = { type: actionType };

        const actual = profileOptionsHasChanged(state, action);
        const expected = true;

        expect(actual).toEqual(expected);
      });
    });

    it('should handle UPDATE_TEXT_FIELDS', () => {
      const state = initialDefaultState;
      const action = {
        type: actionTypes.UPDATE_TEXT_FIELDS
      };
      const actual = profileOptionsHasChanged(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });
  });

  describe('textFieldsById reducer', () => {
    const reducer = reducers.textFieldsById;
    it('should return the initial state', () => {
      const action = {};
      const expected = Map();
      expect(reducer(undefined, action)).toEqual(expected);
    });

    it('should handle UPDATE_TEXT_FIELDS', () => {
      const action = {
        textFields: [
          {
            id: '1',
            titleEntries: [{ localeCode: 'en', value: 'Firstname' }, { localeCode: 'fr', value: 'Prénom' }],
            order: 1,
            required: true
          },
          {
            id: '2',
            titleEntries: [{ localeCode: 'en', value: 'Lastname' }, { localeCode: 'fr', value: 'Nom' }],
            order: 2,
            required: true
          },
          {
            id: '3',
            titleEntries: [{ localeCode: 'en', value: 'Custom field' }, { localeCode: 'fr', value: 'Champ personnalisé' }],
            order: 3,
            required: false
          },
          {
            id: '4',
            titleEntries: [
              { localeCode: 'en', value: 'Custom select field' },
              { localeCode: 'fr', value: 'Champ personnalisé select' }
            ],
            order: 4,
            required: false,
            options: [
              {
                id: '1',
                order: 1.0,
                labelEntries: [{ localeCode: 'en', value: 'Option one' }]
              },
              {
                id: '2',
                order: 2.0,
                labelEntries: [{ localeCode: 'en', value: 'Option two' }]
              }
            ]
          }
        ],
        type: actionTypes.UPDATE_TEXT_FIELDS
      };
      const expected = Map({
        '1': Map({
          id: '1',
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Firstname' }), Map({ localeCode: 'fr', value: 'Prénom' })),
          order: 1,
          required: true,
          _hasChanged: false,
          _isNew: false,
          _toDelete: false
        }),
        '2': Map({
          id: '2',
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Lastname' }), Map({ localeCode: 'fr', value: 'Nom' })),
          order: 2,
          required: true,
          _hasChanged: false,
          _isNew: false,
          _toDelete: false
        }),
        '3': Map({
          id: '3',
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'Custom field' }),
            Map({ localeCode: 'fr', value: 'Champ personnalisé' })
          ),
          order: 3,
          required: false,
          _hasChanged: false,
          _isNew: false,
          _toDelete: false
        }),
        '4': Map({
          id: '4',
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'Custom select field' }),
            Map({ localeCode: 'fr', value: 'Champ personnalisé select' })
          ),
          order: 4,
          required: false,
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          options: Map({
            '1': Map({
              id: '1',
              order: 1.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option one' })])
            }),
            '2': Map({
              id: '2',
              order: 2.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option two' })])
            })
          })
        })
      });
      expect(reducer(Map(), action)).toEqual(expected);
    });

    it('should handle the ADD_TEXT_FIELD fieldType text', () => {
      const action = {
        id: '-134582',
        type: actionTypes.ADD_TEXT_FIELD,
        fieldType: 'text'
      };
      const state = Map({
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'First field' }),
            Map({ localeCode: 'fr', value: 'Premier champ' })
          )
        })
      });
      const expected = Map({
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'First field' }),
            Map({ localeCode: 'fr', value: 'Premier champ' })
          )
        }),
        '-134582': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '-134582',
          identifier: 'CUSTOM',
          order: 2.0,
          required: false,
          hidden: false,
          titleEntries: List()
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the ADD_TEXT_FIELD fieldType select', () => {
      const action = {
        id: '-134582',
        type: actionTypes.ADD_TEXT_FIELD,
        fieldType: 'select'
      };
      const state = Map({});
      const expected = Map({
        '-134582': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '-134582',
          identifier: 'CUSTOM',
          order: 1.0,
          required: false,
          hidden: false,
          titleEntries: List(),
          options: Map()
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the DELETE_TEXT_FIELD', () => {
      const action = {
        id: '189387',
        type: actionTypes.DELETE_TEXT_FIELD
      };
      const state = Map({
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'First field' }),
            Map({ localeCode: 'fr', value: 'Premier champ' })
          )
        })
      });
      const expected = Map({
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: true,
          id: '189387',
          order: 1.0,
          required: true,
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'First field' }),
            Map({ localeCode: 'fr', value: 'Premier champ' })
          )
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the UPDATE_TEXT_FIELD_TITLE', () => {
      const action = {
        id: '189387',
        locale: 'en',
        value: 'New title',
        type: actionTypes.UPDATE_TEXT_FIELD_TITLE
      };
      const state = Map({
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'First field' }),
            Map({ localeCode: 'fr', value: 'Premier champ' })
          )
        })
      });
      const expected = Map({
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'New title' }), Map({ localeCode: 'fr', value: 'Premier champ' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the TOGGLE_TEXT_FIELD_REQUIRED', () => {
      const action = {
        id: '189387',
        type: actionTypes.TOGGLE_TEXT_FIELD_REQUIRED
      };
      const state = Map({
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'First field' }),
            Map({ localeCode: 'fr', value: 'Premier champ' })
          )
        })
      });
      const expected = Map({
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: false,
          hidden: false,
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'First field' }),
            Map({ localeCode: 'fr', value: 'Premier champ' })
          )
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);

      const actual2 = reducer(actual, action);
      expect(actual2).toEqual(state.setIn(['189387', '_hasChanged'], true));
    });

    it('should handle the TOGGLE_TEXT_FIELD_HIDDEN', () => {
      const action = {
        id: '189387',
        type: actionTypes.TOGGLE_TEXT_FIELD_HIDDEN
      };
      const state = Map({
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'First field' }),
            Map({ localeCode: 'fr', value: 'Premier champ' })
          )
        })
      });
      const expected = Map({
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          hidden: true,
          titleEntries: List.of(
            Map({ localeCode: 'en', value: 'First field' }),
            Map({ localeCode: 'fr', value: 'Premier champ' })
          )
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);

      const actual2 = reducer(actual, action);
      expect(actual2).toEqual(state.setIn(['189387', '_hasChanged'], true));
    });

    it('should handle the MOVE_TEXT_FIELD_UP', () => {
      const action = {
        id: '189387',
        type: actionTypes.MOVE_TEXT_FIELD_UP
      };
      const state = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const expected = Map({
        '111111': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the MOVE_TEXT_FIELD_UP action (deleted text field in between)', () => {
      const action = {
        id: '189387',
        type: actionTypes.MOVE_TEXT_FIELD_UP
      };
      const state = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '222222': Map({
          _hasChanged: true,
          _isNew: false,
          _toDelete: true,
          id: '222222',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const expected = Map({
        '111111': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '222222': Map({
          _hasChanged: true,
          _isNew: false,
          _toDelete: true,
          id: '222222',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the MOVE_TEXT_FIELD_DOWN', () => {
      const action = {
        id: '189387',
        type: actionTypes.MOVE_TEXT_FIELD_DOWN
      };
      const state = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
        }),
        '888888': Map({
          _hasChanged: true,
          _isNew: false,
          _toDelete: true,
          id: '888888',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 4.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const expected = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
        }),
        '888888': Map({
          _hasChanged: true,
          _isNew: false,
          _toDelete: true,
          id: '888888',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '999999': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the MOVE_TEXT_FIELD_DOWN action (deleted text field in between)', () => {
      const action = {
        id: '189387',
        type: actionTypes.MOVE_TEXT_FIELD_DOWN
      };
      const state = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const expected = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
        }),
        '999999': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the ADD_SELECT_FIELD_OPTION', () => {
      const action = {
        fieldId: '189387',
        id: '1',
        type: actionTypes.ADD_SELECT_FIELD_OPTION
      };
      const state = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map()
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const expected = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map({
            '1': Map({
              id: '1',
              order: 1.0,
              labelEntries: List()
            })
          })
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the UPDATE_SELECT_FIELD_OPTION_LABEL', () => {
      const action = {
        fieldId: '189387',
        id: '1',
        locale: 'en',
        value: 'Option one',
        type: actionTypes.UPDATE_SELECT_FIELD_OPTION_LABEL
      };
      const state = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map({
            '1': Map({
              id: '1',
              order: 1.0,
              labelEntries: List()
            })
          })
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const expected = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map({
            '1': Map({
              id: '1',
              order: 1.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option one' })])
            })
          })
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the MOVE_SELECT_FIELD_OPTION_DOWN', () => {
      const action = {
        fieldId: '189387',
        id: '1',
        type: actionTypes.MOVE_SELECT_FIELD_OPTION_DOWN
      };
      const state = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map({
            '1': Map({
              id: '1',
              order: 1.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option one' })])
            }),
            '2': Map({
              id: '2',
              order: 2.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option two' })])
            }),
            '3': Map({
              id: '3',
              order: 3.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option three' })])
            })
          })
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const expected = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map({
            '1': Map({
              id: '1',
              order: 2.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option one' })]),
              _hasChanged: true
            }),
            '2': Map({
              id: '2',
              order: 1.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option two' })]),
              _hasChanged: true
            }),
            '3': Map({
              id: '3',
              order: 3.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option three' })])
            })
          })
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the MOVE_SELECT_FIELD_OPTION_UP', () => {
      const action = {
        fieldId: '189387',
        id: '3',
        type: actionTypes.MOVE_SELECT_FIELD_OPTION_UP
      };
      const state = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map({
            '1': Map({
              id: '1',
              order: 1.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option one' })])
            }),
            '2': Map({
              id: '2',
              order: 2.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option two' })])
            }),
            '3': Map({
              id: '3',
              order: 3.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option three' })])
            })
          })
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const expected = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map({
            '1': Map({
              id: '1',
              order: 1.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option one' })])
            }),
            '2': Map({
              id: '2',
              order: 3.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option two' })]),
              _hasChanged: true
            }),
            '3': Map({
              id: '3',
              order: 2.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option three' })]),
              _hasChanged: true
            })
          })
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });

    it('should handle the DELETE_SELECT_FIELD_OPTION', () => {
      const action = {
        fieldId: '189387',
        id: '3',
        type: actionTypes.DELETE_SELECT_FIELD_OPTION
      };
      const state = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map({
            '1': Map({
              id: '1',
              order: 1.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option one' })])
            }),
            '2': Map({
              id: '2',
              order: 2.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option two' })])
            }),
            '3': Map({
              id: '3',
              order: 3.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option three' })])
            })
          })
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const expected = Map({
        '111111': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '111111',
          order: 1.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
        }),
        '189387': Map({
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '189387',
          order: 2.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field (select field)' })),
          options: Map({
            '1': Map({
              id: '1',
              order: 1.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option one' })])
            }),
            '2': Map({
              id: '2',
              order: 2.0,
              labelEntries: List([Map({ localeCode: 'en', value: 'Option two' })])
            })
          })
        }),
        '999999': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '999999',
          order: 3.0,
          required: true,
          hidden: false,
          titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
        })
      });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    });
  });
});