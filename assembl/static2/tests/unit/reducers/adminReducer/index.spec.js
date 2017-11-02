import { fromJS, List, Map } from 'immutable';

import * as reducers from '../../../../js/app/reducers/adminReducer';

describe('Admin reducers', () => {
  describe('selectedLocale reducer', () => {
    const { selectedLocale } = reducers;
    it('should return the initial state', () => {
      expect(selectedLocale(undefined, {})).toEqual('fr');
    });

    it('should return state by default', () => {
      const state = 'en';
      const expected = 'en';
      const actual = selectedLocale(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_SELECTED_LOCALE action type', () => {
      const state = 'en';
      const action = {
        type: 'UPDATE_SELECTED_LOCALE',
        newLocale: 'fr'
      };
      const actual = selectedLocale(state, action);
      const expected = 'fr';
      expect(actual).toEqual(expected);
    });
  });

  describe('thematicsInOrder reducer', () => {
    const { thematicsInOrder } = reducers;
    it('should return the initial state', () => {
      const action = {};
      expect(thematicsInOrder(undefined, action)).toEqual(List());
    });

    it('should return the current state for other actions', () => {
      const action = { type: 'FOOBAR' };
      const oldState = List(['0', '1']);
      expect(thematicsInOrder(oldState, action)).toEqual(oldState);
    });

    it('should handle CREATE_NEW_THEMATIC action type', () => {
      const action = {
        id: '-278290',
        type: 'CREATE_NEW_THEMATIC'
      };
      const oldState = List(['0', '1']);
      const expected = List(['0', '1', '-278290']);
      const newState = thematicsInOrder(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_THEMATICS action type', () => {
      const action = {
        thematics: [{ id: '42' }, { id: '27' }],
        type: 'UPDATE_THEMATICS'
      };
      const oldState = List(['0', '1']);
      const expected = List(['42', '27']);
      const newState = thematicsInOrder(oldState, action);
      expect(newState).toEqual(expected);
    });
  });

  describe('thematicsById reducer', () => {
    const { thematicsById } = reducers;
    it('should return the initial state', () => {
      const action = {};
      expect(thematicsById(undefined, action)).toEqual(Map());
    });

    it('should return the current state for other actions', () => {
      const action = { type: 'FOOBAR' };
      const oldState = Map({ 1: { id: '1', titleEntries: [] } });
      expect(thematicsById(oldState, action)).toEqual(oldState);
    });

    it('should handle ADD_QUESTION_TO_THEMATIC action type', () => {
      const action = { id: '1', locale: 'fr', type: 'ADD_QUESTION_TO_THEMATIC' };
      const oldState = fromJS({
        1: {
          questions: [
            {
              titleEntries: [{ localeCode: 'en', value: 'My title' }, { localeCode: 'fr', value: 'Mon titre' }]
            }
          ]
        }
      });
      const expected = fromJS({
        1: {
          questions: [
            {
              titleEntries: [{ localeCode: 'en', value: 'My title' }, { localeCode: 'fr', value: 'Mon titre' }]
            },
            {
              titleEntries: [{ localeCode: 'fr', value: '' }]
            }
          ]
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle CREATE_NEW_THEMATIC action type', () => {
      const action = {
        id: '-278290',
        type: 'CREATE_NEW_THEMATIC'
      };
      const oldState = fromJS({
        0: {
          id: '0'
        },
        1: {
          id: '1'
        }
      });
      const expected = {
        0: {
          id: '0'
        },
        1: {
          id: '1'
        },
        '-278290': {
          id: '-278290',
          isNew: true,
          toDelete: false,
          img: {
            externalUrl: ''
          },
          questions: [],
          titleEntries: [],
          video: null
        }
      };
      const newState = thematicsById(oldState, action);
      expect(newState.toJS()).toEqual(expected);
    });

    it('should handle DELETE_THEMATIC action type');

    it('should handle REMOVE_QUESTION action type', () => {
      const action = { thematicId: '1', index: '1', type: 'REMOVE_QUESTION' };
      const oldState = fromJS({
        1: {
          questions: [
            {
              titleEntries: [{ localeCode: 'en', value: 'Why?' }, { localeCode: 'fr', value: 'Pourquoi?' }]
            },
            {
              titleEntries: [{ localeCode: 'en', value: 'When?' }, { localeCode: 'fr', value: 'Quand?' }]
            },
            {
              titleEntries: [{ localeCode: 'en', value: 'How?' }, { localeCode: 'fr', value: 'Comment?' }]
            }
          ]
        }
      });
      const expected = fromJS({
        1: {
          questions: [
            {
              titleEntries: [{ localeCode: 'en', value: 'Why?' }, { localeCode: 'fr', value: 'Pourquoi?' }]
            },
            {
              titleEntries: [{ localeCode: 'en', value: 'How?' }, { localeCode: 'fr', value: 'Comment?' }]
            }
          ]
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_THEMATIC_IMG_URL action type', () => {
      const action = { id: '1', value: 'http://example.com/toto.png', type: 'UPDATE_THEMATIC_IMG_URL' };
      const oldState = fromJS({
        1: {
          img: {
            externalUrl: ''
          }
        }
      });
      const expected = fromJS({
        1: {
          img: {
            externalUrl: 'http://example.com/toto.png'
          }
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_QUESTION_TITLE action type', () => {
      const action = { thematicId: '1', index: '1', locale: 'en', value: 'What?', type: 'UPDATE_QUESTION_TITLE' };
      const oldState = fromJS({
        1: {
          questions: [
            {
              titleEntries: [{ localeCode: 'en', value: 'Why?' }, { localeCode: 'fr', value: 'Pourquoi?' }]
            },
            {
              titleEntries: [{ localeCode: 'en', value: 'When?' }, { localeCode: 'fr', value: 'Quand?' }]
            },
            {
              titleEntries: [{ localeCode: 'en', value: 'How?' }, { localeCode: 'fr', value: 'Comment?' }]
            }
          ]
        }
      });
      const expected = fromJS({
        1: {
          questions: [
            {
              titleEntries: [{ localeCode: 'en', value: 'Why?' }, { localeCode: 'fr', value: 'Pourquoi?' }]
            },
            {
              titleEntries: [{ localeCode: 'en', value: 'What?' }, { localeCode: 'fr', value: 'Quand?' }]
            },
            {
              titleEntries: [{ localeCode: 'en', value: 'How?' }, { localeCode: 'fr', value: 'Comment?' }]
            }
          ]
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_THEMATIC_IMG_URL action type');

    it('should handle UPDATE_THEMATIC_TITLE action type', () => {
      const action = {
        id: '1',
        locale: 'fr',
        value: 'Nouveau titre',
        type: 'UPDATE_THEMATIC_TITLE'
      };
      const oldState = fromJS({
        0: {},
        1: {
          titleEntries: [{ localeCode: 'en', value: 'My title' }, { localeCode: 'fr', value: 'Mon titre' }]
        }
      });
      const expected = fromJS({
        0: {},
        1: {
          titleEntries: [{ localeCode: 'en', value: 'My title' }, { localeCode: 'fr', value: 'Nouveau titre' }]
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_THEMATIC_TITLE action type with a new locale', () => {
      const action = {
        id: '1',
        locale: 'de',
        value: 'Mein Titel',
        type: 'UPDATE_THEMATIC_TITLE'
      };
      const oldState = fromJS({
        0: {},
        1: {
          titleEntries: [{ localeCode: 'en', value: 'My title' }, { localeCode: 'fr', value: 'Mon titre' }]
        }
      });
      const expected = fromJS({
        0: {},
        1: {
          titleEntries: [
            { localeCode: 'en', value: 'My title' },
            { localeCode: 'fr', value: 'Mon titre' },
            { localeCode: 'de', value: 'Mein Titel' }
          ]
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_THEMATICS action type');

    it('should handle TOGGLE_VIDEO action type', () => {
      const action = {
        id: '1',
        value: 'foobar',
        type: 'TOGGLE_VIDEO'
      };
      const oldState = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [],
            descriptionEntriesBottom: [],
            descriptionEntriesSide: [],
            htmlCode: 'foobar',
            titleEntries: [{ localeCode: 'fr', value: 'Mon titre' }]
          }
        }
      });
      const expected = fromJS({
        1: {
          video: null
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);

      const reducedTwiceExpected = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [],
            descriptionEntriesBottom: [],
            descriptionEntriesSide: [],
            htmlCode: '',
            titleEntries: []
          }
        }
      });
      const reducedTwiceState = thematicsById(newState, action);
      expect(reducedTwiceState).toEqual(reducedTwiceExpected);
    });

    it('should handle UPDATE_VIDEO_HTML_CODE action type', () => {
      const action = {
        id: '1',
        value: 'new code',
        type: 'UPDATE_VIDEO_HTML_CODE'
      };
      const oldState = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [],
            descriptionEntriesBottom: [],
            descriptionEntriesSide: [],
            htmlCode: 'old code',
            titleEntries: []
          }
        }
      });
      const expected = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [],
            descriptionEntriesBottom: [],
            descriptionEntriesSide: [],
            htmlCode: 'new code',
            titleEntries: []
          }
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_VIDEO_DESCRIPTION_TOP action type', () => {
      const action = {
        id: '1',
        locale: 'en',
        value: 'My new top description',
        type: 'UPDATE_VIDEO_DESCRIPTION_TOP'
      };
      const oldState = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [],
            descriptionEntriesBottom: [],
            descriptionEntriesSide: [],
            htmlCode: '',
            titleEntries: []
          }
        }
      });
      const expected = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [
              {
                localeCode: 'en',
                value: 'My new top description'
              }
            ],
            descriptionEntriesBottom: [],
            descriptionEntriesSide: [],
            htmlCode: '',
            titleEntries: []
          }
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_VIDEO_DESCRIPTION_BOTTOM action type', () => {
      const action = {
        id: '1',
        locale: 'en',
        value: 'My new bottom description',
        type: 'UPDATE_VIDEO_DESCRIPTION_BOTTOM'
      };
      const oldState = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [],
            descriptionEntriesBottom: [],
            descriptionEntriesSide: [],
            htmlCode: '',
            titleEntries: []
          }
        }
      });
      const expected = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [],
            descriptionEntriesBottom: [
              {
                localeCode: 'en',
                value: 'My new bottom description'
              }
            ],
            descriptionEntriesSide: [],
            htmlCode: '',
            titleEntries: []
          }
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_VIDEO_TITLE action type', () => {
      const action = {
        id: '1',
        locale: 'en',
        value: 'My better title',
        type: 'UPDATE_VIDEO_TITLE'
      };
      const oldState = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [],
            descriptionEntriesBottom: [],
            descriptionEntriesSide: [],
            htmlCode: '',
            titleEntries: [{ localeCode: 'fr', value: 'Ma vidéo' }, { localeCode: 'en', value: 'My video' }]
          }
        }
      });
      const expected = fromJS({
        1: {
          video: {
            descriptionEntriesTop: [],
            descriptionEntriesBottom: [],
            descriptionEntriesSide: [],
            htmlCode: '',
            titleEntries: [{ localeCode: 'fr', value: 'Ma vidéo' }, { localeCode: 'en', value: 'My better title' }]
          }
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });
  });
});