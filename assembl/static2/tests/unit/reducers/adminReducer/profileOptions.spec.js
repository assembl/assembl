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
        _hasChanged: false,
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
});