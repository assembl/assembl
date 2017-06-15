import { fromJS, List, Map } from 'immutable';

import * as reducers from '../../../js/app/reducers/adminReducer';

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
          imgUrl: '',
          questions: [],
          titleEntries: [],
          video: {
            titleEntries: [],
            descriptionEntries: [],
            htmlCode: null
          }
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
          titleEntries: [{ localeCode: 'en', value: 'My title' }, { localeCode: 'fr', value: 'Mon titre' }, { localeCode: 'de', value: 'Mein Titel' }]
        }
      });
      const newState = thematicsById(oldState, action);
      expect(newState).toEqual(expected);
    });

    it('should handle UPDATE_THEMATICS action type');
  });
});