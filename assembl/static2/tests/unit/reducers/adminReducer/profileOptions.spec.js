import { List, Map } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes/admin/profileOptions';
import * as reducers from '../../../../js/app/reducers/adminReducer/profileOptions';

describe('profileOptionsHasChanged reducer', () => {
  const reducer = reducers.profileOptionsHasChanged;
  it('should return initial state', () => {
    expect(reducer(undefined, {})).toEqual(false);
  });

  it('should return initial state', () => {
    const action = {
      textFields: [],
      type: actionTypes.UPDATE_TEXT_FIELDS
    };
    expect(reducer(true, action)).toEqual(false);
  });

  [
    actionTypes.ADD_TEXT_FIELD,
    actionTypes.UPDATE_TEXT_FIELD_TITLE,
    actionTypes.DELETE_TEXT_FIELD,
    actionTypes.TOGGLE_TEXT_FIELD_REQUIRED,
    actionTypes.MOVE_TEXT_FIELD_DOWN,
    actionTypes.MOVE_TEXT_FIELD_UP
  ].forEach((actionType) => {
    it(`should handle ${actionType} action`, () => {
      const action = { type: actionType };
      expect(reducer(false, action)).toEqual(true);
    });
  });
});

describe('textFieldsById reducer', () => {
  const reducer = reducers.textFieldsById;
  it('should return the initial state', () => {
    const action = {};
    const expected = Map();
    expect(reducer(undefined, action)).toEqual(expected);
  });

  it('should handle UPDATE_TEXT_FIELDS action', () => {
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
      })
    });
    expect(reducer(Map(), action)).toEqual(expected);
  });

  it('should handle the ADD_TEXT_FIELD action', () => {
    const action = {
      id: '-134582',
      type: actionTypes.ADD_TEXT_FIELD
    };
    const state = Map({
      '189387': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '189387',
        order: 1.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }), Map({ localeCode: 'fr', value: 'Premier champ' }))
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }), Map({ localeCode: 'fr', value: 'Premier champ' }))
      }),
      '-134582': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '-134582',
        identifier: 'CUSTOM',
        order: 2.0,
        required: false,
        titleEntries: List()
      })
    });
    const actual = reducer(state, action);
    expect(actual).toEqual(expected);
  });

  it('should handle the DELETE_TEXT_FIELD action', () => {
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }), Map({ localeCode: 'fr', value: 'Premier champ' }))
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }), Map({ localeCode: 'fr', value: 'Premier champ' }))
      })
    });
    const actual = reducer(state, action);
    expect(actual).toEqual(expected);
  });

  it('should handle the UPDATE_TEXT_FIELD_TITLE action', () => {
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }), Map({ localeCode: 'fr', value: 'Premier champ' }))
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'New title' }), Map({ localeCode: 'fr', value: 'Premier champ' }))
      })
    });
    const actual = reducer(state, action);
    expect(actual).toEqual(expected);
  });

  it('should handle the TOGGLE_TEXT_FIELD_REQUIRED action', () => {
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }), Map({ localeCode: 'fr', value: 'Premier champ' }))
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }), Map({ localeCode: 'fr', value: 'Premier champ' }))
      })
    });
    const actual = reducer(state, action);
    expect(actual).toEqual(expected);

    const actual2 = reducer(actual, action);
    expect(actual2).toEqual(state.setIn(['189387', '_hasChanged'], true));
  });

  it('should handle the MOVE_TEXT_FIELD_UP action', () => {
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '189387': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '189387',
        order: 2.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
      }),
      '999999': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '999999',
        order: 3.0,
        required: true,
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '189387': Map({
        _hasChanged: true,
        _isNew: true,
        _toDelete: false,
        id: '189387',
        order: 1.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
      }),
      '999999': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '999999',
        order: 3.0,
        required: true,
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '222222': Map({
        _hasChanged: true,
        _isNew: false,
        _toDelete: true,
        id: '222222',
        order: 2.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '189387': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '189387',
        order: 2.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
      }),
      '999999': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '999999',
        order: 3.0,
        required: true,
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '222222': Map({
        _hasChanged: true,
        _isNew: false,
        _toDelete: true,
        id: '222222',
        order: 2.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '189387': Map({
        _hasChanged: true,
        _isNew: true,
        _toDelete: false,
        id: '189387',
        order: 1.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
      }),
      '999999': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '999999',
        order: 3.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
      })
    });
    const actual = reducer(state, action);
    expect(actual).toEqual(expected);
  });

  it('should handle the MOVE_TEXT_FIELD_DOWN action', () => {
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '189387': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '189387',
        order: 2.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
      }),
      '888888': Map({
        _hasChanged: true,
        _isNew: false,
        _toDelete: true,
        id: '888888',
        order: 3.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '999999': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '999999',
        order: 4.0,
        required: true,
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '189387': Map({
        _hasChanged: true,
        _isNew: true,
        _toDelete: false,
        id: '189387',
        order: 3.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
      }),
      '888888': Map({
        _hasChanged: true,
        _isNew: false,
        _toDelete: true,
        id: '888888',
        order: 3.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '999999': Map({
        _hasChanged: true,
        _isNew: true,
        _toDelete: false,
        id: '999999',
        order: 2.0,
        required: true,
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '189387': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '189387',
        order: 2.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
      }),
      '999999': Map({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        id: '999999',
        order: 3.0,
        required: true,
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
        titleEntries: List.of(Map({ localeCode: 'en', value: 'First field' }))
      }),
      '189387': Map({
        _hasChanged: true,
        _isNew: true,
        _toDelete: false,
        id: '189387',
        order: 3.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Second field' }))
      }),
      '999999': Map({
        _hasChanged: true,
        _isNew: true,
        _toDelete: false,
        id: '999999',
        order: 2.0,
        required: true,
        titleEntries: List.of(Map({ localeCode: 'en', value: 'Third field' }))
      })
    });
    const actual = reducer(state, action);
    expect(actual).toEqual(expected);
  });
});