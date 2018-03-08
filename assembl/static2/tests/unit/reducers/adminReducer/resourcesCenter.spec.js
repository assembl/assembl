import { fromJS, List, Map } from 'immutable';

import {
  CREATE_RESOURCE,
  DELETE_RESOURCE,
  UPDATE_RESOURCE_DOCUMENT,
  UPDATE_RESOURCE_EMBED_CODE,
  UPDATE_RESOURCE_IMAGE,
  UPDATE_RESOURCE_TEXT,
  UPDATE_RESOURCE_TITLE,
  UPDATE_RESOURCES,
  UPDATE_RC_PAGE_TITLE,
  UPDATE_RC_HEADER_IMAGE
} from '../../../../js/app/actions/actionTypes';
import * as reducers from '../../../../js/app/reducers/adminReducer/resourcesCenter';

describe('resourcesCenter admin reducers', () => {
  describe('page reducer', () => {
    const { page } = reducers;
    it('should return the initial state', () => {
      const action = {};
      expect(page(undefined, action)).toEqual(
        Map({
          _hasChanged: false,
          titleEntries: List(),
          headerImage: Map({ externalUrl: '', mimeType: '', title: '' })
        })
      );
    });

    it('should return the current state for other actions', () => {
      const action = { type: 'FOOBAR' };
      const oldState = Map({
        _hasChanged: false,
        titleEntries: List.of({ locale: 'en', value: 'Resources center' }),
        headerImage: Map({
          externalUrl: '',
          mimeType: '',
          title: ''
        })
      });
      expect(page(oldState, action)).toEqual(oldState);
    });

    it('should handle UPDATE_RC_PAGE_TITLE action type', () => {
      const oldState = fromJS({
        _hasChanged: false,
        titleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
        headerImage: {
          externalUrl: '',
          mimeType: '',
          title: ''
        }
      });
      const expected = fromJS({
        _hasChanged: true,
        titleEntries: [{ localeCode: 'fr', value: 'Centre de ressources' }, { localeCode: 'en', value: 'in english' }],
        headerImage: {
          externalUrl: '',
          mimeType: '',
          title: ''
        }
      });
      const action = {
        locale: 'fr',
        value: 'Centre de ressources',
        type: UPDATE_RC_PAGE_TITLE
      };
      expect(page(oldState, action)).toEqual(expected);
    });

    it('should handle UPDATE_RC_HEADER_IMAGE action type', () => {
      const oldState = fromJS({
        _hasChanged: false,
        headerImage: {
          externalUrl: '',
          mimeType: ''
        },
        titleEntries: []
      });
      const file = new File([''], 'foo.jpg', { type: 'image/jpeg' });
      const expected = {
        _hasChanged: true,
        headerImage: {
          externalUrl: file,
          mimeType: 'image/jpeg'
        },
        titleEntries: []
      };
      const action = {
        value: file,
        type: UPDATE_RC_HEADER_IMAGE
      };
      const actual = page(oldState, action);
      expect(actual.toJS()).toEqual(expected);
    });
  });

  describe('resourcesInOrder reducer', () => {
    const { resourcesInOrder } = reducers;
    it('should return the initial state', () => {
      const action = {};
      expect(resourcesInOrder(undefined, action)).toEqual(List());
    });

    it('should return the current state for other actions', () => {
      const action = { type: 'FOOBAR' };
      const oldState = List(['0', '1']);
      expect(resourcesInOrder(oldState, action)).toEqual(oldState);
    });

    it('should handle CREATE_RESOURCE action type', () => {
      const action = {
        id: '-3344789',
        order: 3,
        type: CREATE_RESOURCE
      };
      const oldState = List(['0', '1']);
      const expected = List(['0', '1', '-3344789']);
      const newState = resourcesInOrder(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_RESOURCES action type', () => {
      const action = {
        resources: [{ id: 'foo' }, { id: 'bar' }, { id: 'fiz' }],
        type: UPDATE_RESOURCES
      };
      const oldState = List(['0', '1']);
      const expected = List(['foo', 'bar', 'fiz']);
      const newState = resourcesInOrder(oldState, action);
      expect(newState).toEqual(expected);
    });
  });

  describe('resourcesById reducer', () => {
    const { resourcesById } = reducers;
    it('should return the initial state', () => {
      const action = {};
      expect(resourcesById(undefined, action)).toEqual(Map());
    });

    it('should return the current state for other actions', () => {
      const action = { type: 'FOOBAR' };
      const oldState = Map({ '1': { id: '1', titleEntries: List() } });
      expect(resourcesById(oldState, action)).toEqual(oldState);
    });

    it('should handle CREATE_RESOURCE action type', () => {
      const action = {
        id: '-3344789',
        order: 3,
        type: CREATE_RESOURCE
      };
      const oldState = fromJS({
        '0': {
          id: '0'
        },
        '1': {
          id: '1'
        }
      });
      const expected = Map({
        '0': Map({
          id: '0'
        }),
        '1': Map({
          id: '1'
        }),
        '-3344789': Map({
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          doc: Map({
            externalUrl: ''
          }),
          img: Map({
            externalUrl: '',
            mimeType: ''
          }),
          titleEntries: List(),
          textEntries: List(),
          embedCode: '',
          id: '-3344789',
          order: 3
        })
      });
      const newState = resourcesById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle DELETE_RESOURCE action type', () => {
      const action = {
        id: '333',
        type: DELETE_RESOURCE
      };
      const oldState = fromJS({
        '000': {
          id: '000',
          _toDelete: true
        },
        '111': {
          id: '111',
          _toDelete: false
        },
        '333': {
          id: '333',
          _toDelete: false
        }
      });
      const expected = {
        '000': {
          id: '000',
          _toDelete: true
        },
        '111': {
          id: '111',
          _toDelete: false
        },
        '333': {
          id: '333',
          _toDelete: true
        }
      };
      const newState = resourcesById(oldState, action);
      expect(newState.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_RESOURCE_DOCUMENT action type', () => {
      const oldState = fromJS({
        '-3344789': {
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          doc: {
            externalUrl: ''
          },
          img: {
            externalUrl: '',
            mimeType: ''
          },
          titleEntries: [],
          textEntries: [],
          embedCode: '<iframe ... />',
          order: 3
        }
      });
      const file = new File([''], 'foo.pdf', { type: 'application/pdf' });
      const expected = {
        '-3344789': {
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          doc: {
            externalUrl: file
          },
          img: {
            externalUrl: '',
            mimeType: ''
          },
          titleEntries: [],
          textEntries: [],
          embedCode: '<iframe ... />',
          order: 3
        }
      };
      const action = {
        id: '-3344789',
        value: file,
        type: UPDATE_RESOURCE_DOCUMENT
      };
      const actual = resourcesById(oldState, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_RESOURCE_EMBED_CODE action type', () => {
      const oldState = fromJS({
        '-3344789': {
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          titleEntries: [],
          textEntries: [],
          embedCode: '<iframe ... />',
          order: 3
        }
      });
      const expected = {
        '-3344789': {
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          titleEntries: [],
          textEntries: [],
          embedCode: '<iframe src="http://www.example.com/greatslides" />',
          order: 3
        }
      };
      const action = {
        id: '-3344789',
        value: '<iframe src="http://www.example.com/greatslides" />',
        type: UPDATE_RESOURCE_EMBED_CODE
      };
      const actual = resourcesById(oldState, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_RESOURCE_IMAGE action type', () => {
      const oldState = fromJS({
        '-3344789': {
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          img: {
            externalUrl: '',
            mimeType: ''
          },
          titleEntries: [],
          textEntries: [],
          embedCode: '<iframe ... />',
          order: 3
        }
      });
      const file = new File([''], 'foo.jpg', { type: 'image/jpeg' });
      const expected = {
        '-3344789': {
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          img: {
            externalUrl: file,
            mimeType: 'image/jpeg'
          },
          titleEntries: [],
          textEntries: [],
          embedCode: '<iframe ... />',
          order: 3
        }
      };
      const action = {
        id: '-3344789',
        value: file,
        type: UPDATE_RESOURCE_IMAGE
      };
      const actual = resourcesById(oldState, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_RESOURCE_TEXT action type', () => {
      const oldState = fromJS({
        '-3344789': {
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          titleEntries: [],
          textEntries: [{ localeCode: 'fr', value: 'texte en français' }, { localeCode: 'en', value: 'text in english' }],
          embedCode: '',
          order: 3
        }
      });
      const expected = {
        '-3344789': {
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          titleEntries: [],
          textEntries: [{ localeCode: 'fr', value: 'nouvelle valeur' }, { localeCode: 'en', value: 'text in english' }],
          embedCode: '',
          order: 3
        }
      };
      const action = {
        id: '-3344789',
        locale: 'fr',
        value: 'nouvelle valeur',
        type: UPDATE_RESOURCE_TEXT
      };
      const actual = resourcesById(oldState, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_RESOURCE_TITLE action type', () => {
      const oldState = fromJS({
        '-3344789': {
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          titleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
          textEntries: [],
          embedCode: '',
          order: 3
        }
      });
      const expected = {
        '-3344789': {
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          titleEntries: [{ localeCode: 'fr', value: 'nouvelle valeur' }, { localeCode: 'en', value: 'in english' }],
          textEntries: [],
          embedCode: '',
          order: 3
        }
      };
      const action = {
        id: '-3344789',
        locale: 'fr',
        value: 'nouvelle valeur',
        type: UPDATE_RESOURCE_TITLE
      };
      const actual = resourcesById(oldState, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_RESOURCES action type', () => {
      const action = {
        resources: [
          {
            id: 'foo',
            doc: { externalUrl: 'http://files.com/myfile.pdf' },
            embedCode: 'xyz',
            textEntries: [],
            titleEntries: [{ localeCode: 'en', value: 'interface' }, { localeCode: 'fr', value: 'interface' }]
          },
          {
            id: 'bar',
            embedCode: '<span>nothing here</span>',
            image: { externalUrl: 'http://myimage.jpg', mimeType: 'image/jpeg' },
            textEntries: [{ localeCode: 'en', value: 'program' }],
            titleEntries: [{ localeCode: 'en', value: 'wireless' }]
          }
        ],
        type: UPDATE_RESOURCES
      };
      const oldState = fromJS({
        '-3344789': {
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          id: '-3344789',
          titleEntries: [{ localeCode: 'fr', value: 'en français' }, { localeCode: 'en', value: 'in english' }],
          textEntries: [],
          embedCode: '',
          order: 3
        }
      });
      const expected = fromJS({
        foo: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          id: 'foo',
          order: 1,
          doc: { externalUrl: 'http://files.com/myfile.pdf' },
          img: { externalUrl: '', mimeType: '' },
          textEntries: [],
          titleEntries: [{ localeCode: 'en', value: 'interface' }, { localeCode: 'fr', value: 'interface' }],
          embedCode: 'xyz'
        },
        bar: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          id: 'bar',
          order: 2,
          doc: { externalUrl: '' },
          img: { externalUrl: 'http://myimage.jpg', mimeType: 'image/jpeg' },
          textEntries: [{ localeCode: 'en', value: 'program' }],
          titleEntries: [{ localeCode: 'en', value: 'wireless' }],
          embedCode: '<span>nothing here</span>'
        }
      });
      const newState = resourcesById(oldState, action);
      expect(newState).toEqual(expected);
    });
  });
});