import { fromJS, List, Map } from 'immutable';

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

  it('should handle MOVE_LANDING_PAGE_MODULE_DOWN action type', () => {
    const action = {
      moduleTypeIdentifier: 'INTRODUCTION',
      type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
    };
    const oldState = List.of('HEADER', 'INTRODUCTION', 'TIMELINE', 'FOOTER');
    const expected = List.of('HEADER', 'TIMELINE', 'INTRODUCTION', 'FOOTER');
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
  });

  it('should handle MOVE_LANDING_PAGE_MODULE_DOWN action type, no change if module is the last before FOOTER', () => {
    const action = {
      moduleTypeIdentifier: 'TIMELINE',
      type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
    };
    const oldState = List.of('HEADER', 'INTRODUCTION', 'TIMELINE', 'FOOTER');
    const actual = reducer(oldState, action);
    expect(actual).toEqual(oldState);
  });

  it('should handle MOVE_LANDING_PAGE_MODULE_UP action type', () => {
    const action = {
      moduleTypeIdentifier: 'TIMELINE',
      type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
    };
    const oldState = List.of('HEADER', 'INTRODUCTION', 'TIMELINE', 'FOOTER');
    const expected = List.of('HEADER', 'TIMELINE', 'INTRODUCTION', 'FOOTER');
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
  });

  it('should handle MOVE_LANDING_PAGE_MODULE_UP action type, no change if module is the first after HEADER', () => {
    const action = {
      moduleTypeIdentifier: 'INTRODUCTION',
      type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
    };
    const oldState = List.of('HEADER', 'INTRODUCTION', 'TIMELINE', 'FOOTER');
    const actual = reducer(oldState, action);
    expect(actual).toEqual(oldState);
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

  it('should handle MOVE_LANDING_PAGE_MODULE_UP action type', () => {
    const action = {
      moduleTypeIdentifier: 'INTRODUCTION',
      type: actionTypes.MOVE_LANDING_PAGE_MODULE_UP
    };
    const oldState = false;
    const expected = true;
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
  });

  it('should handle MOVE_LANDING_PAGE_MODULE_DOWN action type', () => {
    const action = {
      moduleTypeIdentifier: 'INTRODUCTION',
      type: actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN
    };
    const oldState = false;
    const expected = true;
    const actual = reducer(oldState, action);
    expect(actual).toEqual(expected);
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

describe('page reducer', () => {
  const reducer = reducers.page;
  it('should handle UPDATE_LANDING_PAGE_HEADER_TITLE action type', () => {
    const oldState = fromJS({
      _hasChanged: false,
      titleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      subtitleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      buttonLabelEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      headerImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      },
      logoImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      }
    });
    const expected = fromJS({
      _hasChanged: true,
      titleEntries: [{ localeCode: 'fr', value: 'nouvelle valeur en français' }, { localeCode: 'en', value: 'in english' }],
      subtitleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      buttonLabelEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      headerImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      },
      logoImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      }
    });
    const action = {
      locale: 'fr',
      value: 'nouvelle valeur en français',
      type: actionTypes.UPDATE_LANDING_PAGE_HEADER_TITLE
    };
    expect(reducer(oldState, action)).toEqual(expected);
  });

  it('should handle UPDATE_LANDING_PAGE_HEADER_SUBTITLE action type', () => {
    const oldState = fromJS({
      _hasChanged: false,
      titleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      subtitleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      buttonLabelEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      headerImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      },
      logoImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      }
    });
    const expected = fromJS({
      _hasChanged: true,
      titleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      subtitleEntries: [{ localeCode: 'fr', value: 'nouvelle valeur en français' }, { localeCode: 'en', value: 'in english' }],
      buttonLabelEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      headerImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      },
      logoImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      }
    });
    const action = {
      locale: 'fr',
      value: 'nouvelle valeur en français',
      type: actionTypes.UPDATE_LANDING_PAGE_HEADER_SUBTITLE
    };
    expect(reducer(oldState, action)).toEqual(expected);
  });

  it('should handle UPDATE_LANDING_PAGE_HEADER_BUTTON_LABEL action type', () => {
    const oldState = fromJS({
      _hasChanged: false,
      titleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      subtitleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      buttonLabelEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      headerImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      },
      logoImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      }
    });
    const expected = fromJS({
      _hasChanged: true,
      titleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      subtitleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
      buttonLabelEntries: [{ localeCode: 'fr', value: 'nouvelle valeur en français' }, { localeCode: 'en', value: 'in english' }],
      headerImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      },
      logoImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      }
    });
    const action = {
      locale: 'fr',
      value: 'nouvelle valeur en français',
      type: actionTypes.UPDATE_LANDING_PAGE_HEADER_BUTTON_LABEL
    };
    expect(reducer(oldState, action)).toEqual(expected);
  });

  it('should handle UPDATE_LANDING_PAGE_HEADER_IMAGE action type', () => {
    const oldState = fromJS({
      _hasChanged: true,
      titleEntries: [],
      subtitleEntries: [],
      buttonLabelEntries: [],
      headerImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      },
      logoImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      }
    });
    const file = new File([''], 'foo.jpg', { name: 'foo.jpg', type: 'image/jpeg' });
    const expected = {
      _hasChanged: true,
      titleEntries: [],
      subtitleEntries: [],
      buttonLabelEntries: [],
      headerImage: {
        title: '',
        externalUrl: file,
        mimeType: 'image/jpeg'
      },
      logoImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      }
    };
    const action = {
      value: file,
      type: actionTypes.UPDATE_LANDING_PAGE_HEADER_IMAGE
    };
    const actual = reducer(oldState, action);
    expect(actual.toJS()).toEqual(expected);
  });

  it('should handle UPDATE_LANDING_PAGE_HEADER_LOGO action type', () => {
    const oldState = fromJS({
      _hasChanged: true,
      titleEntries: [],
      subtitleEntries: [],
      buttonLabelEntries: [],
      headerImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      },
      logoImage: {
        externalUrl: '',
        mimeType: '',
        title: ''
      }
    });
    const file = new File([''], 'foo.jpg', { name: 'foo.jpg', type: 'image/jpeg' });
    const expected = {
      _hasChanged: true,
      titleEntries: [],
      subtitleEntries: [],
      buttonLabelEntries: [],
      headerImage: {
        title: '',
        externalUrl: '',
        mimeType: ''
      },
      logoImage: {
        externalUrl: file,
        mimeType: 'image/jpeg',
        title: ''
      }
    };
    const action = {
      value: file,
      type: actionTypes.UPDATE_LANDING_PAGE_HEADER_LOGO
    };
    const actual = reducer(oldState, action);
    expect(actual.toJS()).toEqual(expected);
  });
});