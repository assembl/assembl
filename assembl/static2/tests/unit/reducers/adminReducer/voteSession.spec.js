import { fromJS, List, Map } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes';

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
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_TITLE
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
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_SUBTITLE
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
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_TITLE
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
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_CONTENT
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
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE
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
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_IMAGE
      };
      expect(voteSessionPage(oldState, action).toJS()).toEqual(expected);
    });
  });

  describe('voteProposalsById reducer', () => {
    const { voteProposalsById } = reducers;
    it('should handle ADD_MODULE_TO_PROPOSAL action type', () => {
      const proposal1 = fromJS({
        isNew: false,
        order: 1.0,
        toDelete: false,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const state = Map({ proposal1: proposal1 });
      const action = {
        id: 'module42',
        moduleTemplateId: 'template2',
        proposalId: 'proposal1',
        type: actionTypes.ADD_MODULE_TO_PROPOSAL
      };
      const expectedProposal1 = fromJS({
        isNew: false,
        order: 1.0,
        toDelete: false,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: ['module42']
      });
      const expected = Map({ proposal1: expectedProposal1 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });
  });

  describe('modulesById reducer', () => {
    const { modulesById } = reducers;
    it('should handle ADD_MODULE_TO_PROPOSAL action type', () => {
      const state = Map();
      const action = {
        id: 'module42',
        moduleInfo: {
          tokenCategories: [],
          voteType: 'tokens'
        },
        moduleTemplateId: 'template2',
        proposalId: 'proposal1',
        type: actionTypes.ADD_MODULE_TO_PROPOSAL
      };
      const expected = {
        module42: {
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          isNew: true,
          proposalId: 'proposal1',
          voteSpecTemplateId: 'template2',
          toDelete: false
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle DELETE_MODULE_FROM_PROPOSAL action type', () => {
      const state = fromJS({
        module42: {
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          isNew: false,
          moduleTemplateId: 'template2',
          proposalId: 'proposal1',
          toDelete: false
        }
      });
      const action = {
        moduleId: 'module42',
        type: actionTypes.DELETE_MODULE_FROM_PROPOSAL
      };
      const expected = {
        module42: {
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          isNew: false,
          moduleTemplateId: 'template2',
          proposalId: 'proposal1',
          toDelete: true
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UNDELETE_MODULE action type', () => {
      const state = fromJS({
        module42: {
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          isNew: false,
          moduleTemplateId: 'template2',
          proposalId: 'proposal1',
          toDelete: true
        }
      });
      const action = {
        id: 'module42',
        type: actionTypes.UNDELETE_MODULE
      };
      const expected = {
        module42: {
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          isNew: false,
          moduleTemplateId: 'template2',
          proposalId: 'proposal1',
          toDelete: false
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });
  });
});