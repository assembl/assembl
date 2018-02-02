import { fromJS, List, Map } from 'immutable';

import {
  UPDATE_VOTE_SESSION_PAGE_TITLE,
  UPDATE_VOTE_SESSION_PAGE_SUBTITLE,
  UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_TITLE,
  UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_CONTENT,
  UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE,
  UPDATE_VOTE_SESSION_PAGE_IMAGE
} from '../../../../js/app/actions/actionTypes';

import * as reducers from '../../../../js/app/reducers/adminReducer/voteSession';

describe('voteSession admin reducers', () => {
  describe('page reducer', () => {
    const { voteSessionPage } = reducers;
    it('should return the initial state', () => {
      const action = {};
      expect(voteSessionPage(undefined, action)).toEqual(
        Map({
          hasChanged: false,
          id: '',
          titleEntries: List(),
          subTitleEntries: List(),
          instructionsSectionTitleEntries: List(),
          instructionsSectionContentEntries: List(),
          propositionsSectionTitleEntries: List(),
          headerImage: Map({ externalUrl: '', mimeType: '', title: '' })
        })
      );
    });
    it('should return the current state for other actions', () => {
      const action = { type: 'WHATEVER' };
      const oldState = Map({
        hasChanged: false,
        id: '',
        titleEntries: List.of({ locale: 'en', value: 'Vote session title' }),
        subTitleEntries: List(),
        instructionsSectionTitleEntries: List(),
        instructionsSectionContentEntries: List(),
        propositionsSectionTitleEntries: List(),
        headerImage: Map({ externalUrl: '', mimeType: '', title: '' })
      });
      expect(voteSessionPage(oldState, action)).toEqual(oldState);
    });
    it('should handle UPDATE_VOTE_SESSION_PAGE_TITLE action type', () => {
      const oldState = fromJS({
        hasChanged: false,
        id: '',
        titleEntries: [{ localeCode: 'fr', value: 'Titre en français' }, { localeCode: 'en', value: 'Title in english' }],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const expected = fromJS({
        hasChanged: true,
        id: '',
        titleEntries: [
          { localeCode: 'fr', value: 'Titre en français' },
          { localeCode: 'en', value: 'An elaborate title for the vote session page' }
        ],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const action = {
        locale: 'en',
        value: 'An elaborate title for the vote session page',
        type: UPDATE_VOTE_SESSION_PAGE_TITLE
      };
      expect(voteSessionPage(oldState, action)).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_SESSION_PAGE_SUBTITLE action type', () => {
      const oldState = fromJS({
        hasChanged: false,
        id: '',
        titleEntries: [],
        subTitleEntries: [
          { localeCode: 'fr', value: 'Sous-titre en français' },
          { localeCode: 'en', value: 'Subtitle in english' }
        ],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const expected = fromJS({
        hasChanged: true,
        id: '',
        titleEntries: [],
        subTitleEntries: [
          { localeCode: 'fr', value: 'Sous-titre en français' },
          { localeCode: 'en', value: 'Superb subtitle in english' }
        ],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const action = {
        locale: 'en',
        value: 'Superb subtitle in english',
        type: UPDATE_VOTE_SESSION_PAGE_SUBTITLE
      };
      expect(voteSessionPage(oldState, action)).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_TITLE action type', () => {
      const oldState = fromJS({
        hasChanged: false,
        id: '',
        titleEntries: [],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [
          { localeCode: 'fr', value: 'Titre des instructions en français' },
          { localeCode: 'en', value: 'Title of the instructions in english' }
        ],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const expected = fromJS({
        hasChanged: true,
        id: '',
        titleEntries: [],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [
          { localeCode: 'fr', value: 'Titre des instructions en français' },
          { localeCode: 'en', value: 'A much better title for the instructions in english' }
        ],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const action = {
        locale: 'en',
        value: 'A much better title for the instructions in english',
        type: UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_TITLE
      };
      expect(voteSessionPage(oldState, action)).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_CONTENT action type', () => {
      const oldState = fromJS({
        hasChanged: false,
        id: '',
        titleEntries: [],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [
          { localeCode: 'fr', value: 'Instructions en français' },
          { localeCode: 'en', value: 'Instructions in english' }
        ],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const expected = fromJS({
        hasChanged: true,
        id: '',
        titleEntries: [],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [
          { localeCode: 'fr', value: 'Instructions en français' },
          { localeCode: 'en', value: 'More elaborated instructions in english' }
        ],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const action = {
        locale: 'en',
        value: 'More elaborated instructions in english',
        type: UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_CONTENT
      };
      expect(voteSessionPage(oldState, action)).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE action type', () => {
      const oldState = fromJS({
        hasChanged: false,
        id: '',
        titleEntries: [],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [
          { localeCode: 'fr', value: 'Titre des propositions en français' },
          { localeCode: 'en', value: 'Title of the propositions in english' }
        ],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const expected = fromJS({
        hasChanged: true,
        id: '',
        titleEntries: [],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [
          { localeCode: 'fr', value: 'Titre des propositions en français' },
          { localeCode: 'en', value: 'Much better propositions title in english' }
        ],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const action = {
        locale: 'en',
        value: 'Much better propositions title in english',
        type: UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE
      };
      expect(voteSessionPage(oldState, action)).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_SESSION_PAGE_IMAGE action type', () => {
      const oldState = fromJS({
        hasChanged: false,
        id: '',
        titleEntries: [],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '' }
      });
      const file = new File([''], 'foo.jpg', { type: 'image/jpeg' });
      const expected = {
        hasChanged: true,
        id: '',
        titleEntries: [],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: file, mimeType: 'image/jpeg' }
      };
      const action = {
        value: file,
        type: UPDATE_VOTE_SESSION_PAGE_IMAGE
      };
      expect(voteSessionPage(oldState, action).toJS()).toEqual(expected);
    });
  });
});