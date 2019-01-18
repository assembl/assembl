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
          _hasChanged: false,
          seeCurrentVotes: false,
          id: '',
          propositionsSectionTitleEntries: List(),
          headerImage: Map({ externalUrl: '', mimeType: '', title: '' })
        })
      );
    });
    it('should return the current state for other actions', () => {
      const action = { type: 'WHATEVER' };
      const oldState = Map({
        _hasChanged: false,
        seeCurrentVotes: false,
        id: '',
        propositionsSectionTitleEntries: List(),
        headerImage: Map({ externalUrl: '', mimeType: '', title: '' })
      });
      expect(voteSessionPage(oldState, action)).toEqual(oldState);
    });

    it('should handle UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE action type', () => {
      const oldState = fromJS({
        _hasChanged: false,
        seeCurrentVotes: false,
        id: '',
        propositionsSectionTitleEntries: [
          { localeCode: 'fr', value: 'Titre des propositions en français' },
          { localeCode: 'en', value: 'Title of the propositions in english' }
        ],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const expected = fromJS({
        _hasChanged: true,
        seeCurrentVotes: false,
        id: '',
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

    it('should handle UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES action type', () => {
      const oldState = fromJS({
        _hasChanged: false,
        seeCurrentVotes: false,
        id: '',
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const expected = fromJS({
        _hasChanged: true,
        seeCurrentVotes: true,
        id: '',
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const action = {
        value: true,
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES
      };
      expect(voteSessionPage(oldState, action)).toEqual(expected);
    });
  });

  describe('modulesOrProposalsHaveChanged reducer', () => {
    const { modulesOrProposalsHaveChanged } = reducers;

    it('should handle ADD_MODULE_TO_PROPOSAL action', () => {
      const action = {
        id: 'my-module',
        voteSpecTemplateId: 'my-template',
        proposalId: 'my-proposal',
        type: actionTypes.ADD_MODULE_TO_PROPOSAL
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle CANCEL_MODULE_CUSTOMIZATION action', () => {
      const action = {
        id: 'my-module',
        type: actionTypes.CANCEL_MODULE_CUSTOMIZATION
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle CREATE_GAUGE_VOTE_CHOICE action', () => {
      const action = {
        id: 'my-module',
        type: actionTypes.CREATE_GAUGE_VOTE_CHOICE
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle CREATE_GAUGE_VOTE_MODULE action', () => {
      const action = {
        type: actionTypes.CREATE_GAUGE_VOTE_MODULE
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle CREATE_TOKEN_VOTE_CATEGORY action', () => {
      const action = {
        type: actionTypes.CREATE_TOKEN_VOTE_CATEGORY
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle CREATE_TOKEN_VOTE_MODULE action', () => {
      const action = {
        type: actionTypes.CREATE_TOKEN_VOTE_MODULE
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle CREATE_VOTE_PROPOSAL action', () => {
      const action = {
        id: 'my-proposal',
        type: actionTypes.CREATE_VOTE_PROPOSAL
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_MODULE action', () => {
      const action = {
        id: 'my-module',
        locale: 'en',
        info: {},
        type: actionTypes.UPDATE_VOTE_MODULE
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle DELETE_GAUGE_VOTE_CHOICE action', () => {
      const action = {
        type: actionTypes.DELETE_GAUGE_VOTE_CHOICE
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle DELETE_TOKEN_VOTE_CATEGORY action', () => {
      const action = {
        type: actionTypes.DELETE_TOKEN_VOTE_CATEGORY
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle DELETE_VOTE_MODULE action', () => {
      const action = {
        id: 'my-module',
        type: actionTypes.DELETE_VOTE_MODULE
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle DELETE_VOTE_PROPOSAL action', () => {
      const action = {
        id: 'my-proposal',
        type: actionTypes.DELETE_VOTE_PROPOSAL
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle MARK_ALL_DEPENDENCIES_AS_CHANGED action', () => {
      const action = {
        id: 'my-module',
        type: actionTypes.MARK_ALL_DEPENDENCIES_AS_CHANGED
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle MOVE_PROPOSAL_DOWN action', () => {
      const action = {
        id: 'my-proposal',
        type: actionTypes.MOVE_PROPOSAL_DOWN
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle MOVE_PROPOSAL_UP action', () => {
      const action = {
        id: 'my-proposal',
        type: actionTypes.MOVE_PROPOSAL_UP
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_GAUGE_MAXIMUM action', () => {
      const action = {
        type: actionTypes.UPDATE_GAUGE_MAXIMUM
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_GAUGE_MINIMUM action', () => {
      const action = {
        type: actionTypes.UPDATE_GAUGE_MINIMUM
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_GAUGE_UNIT action', () => {
      const action = {
        type: actionTypes.UPDATE_GAUGE_UNIT
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_GAUGE_VOTE_CHOICE_LABEL action', () => {
      const action = {
        type: actionTypes.UPDATE_GAUGE_VOTE_CHOICE_LABEL
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_GAUGE_VOTE_INSTRUCTIONS action', () => {
      const action = {
        type: actionTypes.UPDATE_GAUGE_VOTE_INSTRUCTIONS
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_GAUGE_VOTE_IS_NUMBER action', () => {
      const action = {
        type: actionTypes.UPDATE_GAUGE_VOTE_IS_NUMBER
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_GAUGE_VOTE_NUMBER_TICKS action', () => {
      const action = {
        type: actionTypes.UPDATE_GAUGE_VOTE_NUMBER_TICKS
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_TOKEN_TOTAL_NUMBER action', () => {
      const action = {
        type: actionTypes.UPDATE_TOKEN_TOTAL_NUMBER
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_TOKEN_VOTE_CATEGORY_COLOR action', () => {
      const action = {
        type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_COLOR
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_TOKEN_VOTE_CATEGORY_TITLE action', () => {
      const action = {
        type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY action', () => {
      const action = {
        type: actionTypes.UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });
    it('should handle UPDATE_TOKEN_VOTE_INSTRUCTIONS action', () => {
      const action = {
        type: actionTypes.UPDATE_TOKEN_VOTE_INSTRUCTIONS
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_PROPOSAL_DESCRIPTION action', () => {
      const action = {
        id: 'my-proposal',
        locale: 'en',
        value: 'We need to transmit the open-source PNG bus!',
        type: actionTypes.UPDATE_VOTE_PROPOSAL_DESCRIPTION
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_PROPOSAL_TITLE action', () => {
      const action = {
        id: 'my-proposal',
        locale: 'en',
        value: 'The XML interface is down, override the virtual alarm so we can parse the SAS firewall!',
        type: actionTypes.UPDATE_VOTE_PROPOSAL_TITLE
      };
      const expected = true;
      const actual = modulesOrProposalsHaveChanged(false, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_MODULES action', () => {
      const action = {
        voteModules: [],
        type: actionTypes.UPDATE_VOTE_MODULES
      };
      const expected = false;
      const actual = modulesOrProposalsHaveChanged(true, action);
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_PROPOSALS action', () => {
      const action = {
        voteProposals: [],
        type: actionTypes.UPDATE_VOTE_PROPOSALS
      };
      const expected = false;
      const actual = modulesOrProposalsHaveChanged(true, action);
      expect(actual).toEqual(expected);
    });
  });

  describe('voteProposalsById reducer', () => {
    const { voteProposalsById } = reducers;

    it('should handle CREATE_VOTE_PROPOSAL action type', () => {
      const proposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const state = Map({ proposal1: proposal1 });
      const action = {
        id: 'proposal2',
        type: actionTypes.CREATE_VOTE_PROPOSAL
      };
      const expectedProposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      let expectedProposal2 = fromJS({
        _hasChanged: false,
        _isNew: true,
        _toDelete: false,
        order: 2.0,
        id: 'proposal2',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      expectedProposal2 = expectedProposal2.set('_validationErrors', []);
      const expected = Map({ proposal1: expectedProposal1, proposal2: expectedProposal2 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });

    it('should handle MOVE_PROPOSAL_UP action type', () => {
      const proposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const proposal2 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 2.0,
        id: 'proposal2',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const proposal3 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 3.0,
        id: 'proposal3',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const state = Map({ proposal1: proposal1, proposal2: proposal2, proposal3: proposal3 });
      const action = {
        id: 'proposal3',
        type: actionTypes.MOVE_PROPOSAL_UP
      };
      const expectedProposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expectedProposal2 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 3.0,
        id: 'proposal2',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expectedProposal3 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 2.0,
        id: 'proposal3',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expected = Map({ proposal1: expectedProposal1, proposal2: expectedProposal2, proposal3: expectedProposal3 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });

    it('should handle MOVE_PROPOSAL_DOWN action type', () => {
      const proposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const proposal2 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 2.0,
        id: 'proposal2',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const proposal3 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 3.0,
        id: 'proposal3',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const state = Map({ proposal1: proposal1, proposal2: proposal2, proposal3: proposal3 });
      const action = {
        id: 'proposal2',
        type: actionTypes.MOVE_PROPOSAL_DOWN
      };
      const expectedProposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expectedProposal2 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 3.0,
        id: 'proposal2',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expectedProposal3 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 2.0,
        id: 'proposal3',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expected = Map({ proposal1: expectedProposal1, proposal2: expectedProposal2, proposal3: expectedProposal3 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });

    it('should handle MOVE_PROPOSAL_UP action type (deleted proposal in between)', () => {
      const proposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const proposal2 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: true,
        order: 2.0,
        id: 'proposal2',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const proposal3 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 3.0,
        id: 'proposal3',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const state = Map({ proposal1: proposal1, proposal2: proposal2, proposal3: proposal3 });
      const action = {
        id: 'proposal3',
        type: actionTypes.MOVE_PROPOSAL_UP
      };
      const expectedProposal1 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 2.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expectedProposal2 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: true,
        order: 2.0,
        id: 'proposal2',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expectedProposal3 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal3',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expected = Map({ proposal1: expectedProposal1, proposal2: expectedProposal2, proposal3: expectedProposal3 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });

    it('should handle MOVE_PROPOSAL_DOWN action type (deleted proposal in between)', () => {
      const proposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const proposal2 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: true,
        order: 2.0,
        id: 'proposal2',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const proposal3 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 3.0,
        id: 'proposal3',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const state = Map({ proposal1: proposal1, proposal2: proposal2, proposal3: proposal3 });
      const action = {
        id: 'proposal1',
        type: actionTypes.MOVE_PROPOSAL_DOWN
      };
      const expectedProposal1 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 2.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expectedProposal2 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: true,
        order: 2.0,
        id: 'proposal2',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expectedProposal3 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal3',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const expected = Map({ proposal1: expectedProposal1, proposal2: expectedProposal2, proposal3: expectedProposal3 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });

    it('should handle ADD_MODULE_TO_PROPOSAL action type', () => {
      const proposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const state = Map({ proposal1: proposal1 });
      const action = {
        id: 'module42',
        voteSpecTemplateId: 'template2',
        proposalId: 'proposal1',
        type: actionTypes.ADD_MODULE_TO_PROPOSAL
      };
      const expectedProposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: ['module42']
      });
      const expected = Map({ proposal1: expectedProposal1 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });

    it('should handle SET_VALIDATION_ERRORS action type', () => {
      const proposal1 = Map({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        id: 'proposal1',
        titleEntries: List(),
        modules: List(),
        _validationErrors: {}
      });
      const state = Map({ proposal1: proposal1 });
      const action = {
        errors: {
          title: [
            {
              code: 'titleRequired',
              vars: {}
            }
          ],
          modules: [
            {
              code: 'atLeastOneModule',
              vars: {}
            }
          ]
        },
        id: 'proposal1',
        type: actionTypes.SET_VALIDATION_ERRORS
      };
      const expectedProposal1 = Map({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        id: 'proposal1',
        titleEntries: List(),
        modules: List(),
        _validationErrors: {
          modules: [
            {
              code: 'atLeastOneModule',
              vars: {}
            }
          ],
          title: [
            {
              code: 'titleRequired',
              vars: {}
            }
          ]
        }
      });
      const expected = Map({ proposal1: expectedProposal1 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_PROPOSAL_TITLE action type', () => {
      const proposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const state = Map({ proposal1: proposal1 });
      const action = {
        id: 'proposal1',
        type: actionTypes.UPDATE_VOTE_PROPOSAL_TITLE,
        locale: 'en',
        value: 'New title'
      };
      const expectedProposal1 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [{ localeCode: 'en', value: 'New title' }],
        descriptionEntries: [],
        modules: []
      });
      const expected = Map({ proposal1: expectedProposal1 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_PROPOSAL_DESCRIPTION action type', () => {
      const proposal1 = fromJS({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [],
        modules: []
      });
      const state = Map({ proposal1: proposal1 });
      const action = {
        id: 'proposal1',
        type: actionTypes.UPDATE_VOTE_PROPOSAL_DESCRIPTION,
        locale: 'en',
        value: 'New description'
      };
      const expectedProposal1 = fromJS({
        _hasChanged: true,
        _isNew: false,
        _toDelete: false,
        order: 1.0,
        id: 'proposal1',
        titleEntries: [],
        descriptionEntries: [{ localeCode: 'en', value: 'New description' }],
        modules: []
      });
      const expected = Map({ proposal1: expectedProposal1 });
      const result = voteProposalsById(state, action);
      expect(result).toEqual(expected);
    });
  });

  describe('modulesById reducer', () => {
    const { modulesById } = reducers;
    xit('should handle UPDATE_VOTE_MODULES action type', () => {});

    it('should handle DELETE_VOTE_MODULE action type', () => {
      const state = fromJS({
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          voteSpecTemplateId: 'template2',
          proposalId: 'proposal1'
        }
      });
      const action = {
        id: 'module42',
        type: actionTypes.DELETE_VOTE_MODULE
      };
      const expected = {
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          voteSpecTemplateId: 'template2',
          proposalId: 'proposal1'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    xit('should handle CREATE_TOKEN_VOTE_MODULE action type', () => {});

    it('should handle UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY action type', () => {
      const state = fromJS({
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [
            {
              id: 'token1',
              titleEntries: [],
              totalNumber: 10,
              color: 'green'
            },
            {
              id: 'token2',
              titleEntries: [],
              totalNumber: 5,
              color: 'red'
            }
          ],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          voteSpecTemplateId: 'template2',
          proposalId: 'proposal3'
        }
      });
      const action = {
        id: 'module42',
        type: actionTypes.UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY,
        value: true
      };
      const expected = {
        module42: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [
            {
              id: 'token1',
              titleEntries: [],
              totalNumber: 10,
              color: 'green'
            },
            {
              id: 'token2',
              titleEntries: [],
              totalNumber: 5,
              color: 'red'
            }
          ],
          exclusiveCategories: true,
          votetype: 'tokens',
          id: 'module42',
          voteSpecTemplateId: 'template2',
          proposalId: 'proposal3'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_TOKEN_VOTE_INSTRUCTIONS action type', () => {
      const state = fromJS({
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [],
          instructionsEntries: [{ localeCode: 'en', value: 'Please vote guys' }],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          voteSpecTemplateId: 'template2',
          proposalId: 'proposal3'
        }
      });
      const action = {
        id: 'module42',
        type: actionTypes.UPDATE_TOKEN_VOTE_INSTRUCTIONS,
        locale: 'en',
        value: 'Actually do not vote guys'
      };
      const expected = {
        module42: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [],
          instructionsEntries: [{ localeCode: 'en', value: 'Actually do not vote guys' }],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          voteSpecTemplateId: 'template2',
          proposalId: 'proposal3'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle CREATE_TOKEN_VOTE_CATEGORY action type', () => {
      const state = fromJS({
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [],
          voteSpecTemplateId: '12345',
          instructionsEntries: [],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          proposalId: 'proposal3'
        }
      });
      const action = {
        id: 'token1',
        moduleId: 'module42',
        type: actionTypes.CREATE_TOKEN_VOTE_CATEGORY
      };
      const expected = {
        module42: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          tokenCategories: ['token1'],
          voteSpecTemplateId: '12345',
          instructionsEntries: [],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          proposalId: 'proposal3'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle DELETE_TOKEN_VOTE_CATEGORY action type', () => {
      const state = fromJS({
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [
            {
              id: 'token1',
              titleEntries: [],
              totalNumber: 10,
              color: 'green'
            },
            {
              id: 'token2',
              titleEntries: [],
              totalNumber: 5,
              color: 'red'
            }
          ],
          voteSpecTemplateId: '12345',
          instructionsEntries: ['token1'],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          proposalId: 'proposal3'
        }
      });
      const action = {
        moduleId: 'module42',
        index: 1,
        type: actionTypes.DELETE_TOKEN_VOTE_CATEGORY
      };
      const expected = {
        module42: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [
            {
              id: 'token1',
              titleEntries: [],
              totalNumber: 10,
              color: 'green'
            }
          ],
          voteSpecTemplateId: '12345',
          instructionsEntries: ['token1'],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          proposalId: 'proposal3'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_TOKEN_VOTE_CATEGORY_TITLE action type', () => {
      const state = fromJS({
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          tokenCategories: ['1', '2'],
          voteSpecTemplateId: '12345',
          instructionsEntries: ['token1'],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          proposalId: 'proposal3'
        }
      });
      const action = {
        moduleId: 'module42',
        id: 'token1',
        locale: 'en',
        value: 'The amazing token',
        type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE
      };
      const expected = {
        module42: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          tokenCategories: ['1', '2'],
          voteSpecTemplateId: '12345',
          instructionsEntries: ['token1'],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          proposalId: 'proposal3'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    xit('should handle UPDATE_TOKEN_VOTE_CATEGORY_COLOR action type', () => {});

    xit('should handle UPDATE_TOKEN_TOTAL_NUMBER action type', () => {});

    xit('should handle CREATE_GAUGE_VOTE_MODULE action type', () => {});

    xit('should handle UPDATE_GAUGE_VOTE_INSTRUCTIONS action type', () => {});

    xit('should handle UPDATE_GAUGE_VOTE_IS_NUMBER action type', () => {});

    xit('should handle UPDATE_GAUGE_VOTE_NUMBER_TICKS action type', () => {});

    xit('should handle CREATE_GAUGE_VOTE_CHOICE action type', () => {});

    xit('should handle DELETE_GAUGE_VOTE_CHOICE action type', () => {});

    xit('should handle UPDATE_GAUGE_VOTE_CHOICE_LABEL action type', () => {});

    xit('should handle UPDATE_GAUGE_MINIMUM action type', () => {});

    xit('should handle UPDATE_GAUGE_MAXIMUM action type', () => {});

    xit('should handle UPDATE_GAUGE_UNIT action type', () => {});

    xit('should handle UPDATE_VOTE_PROPOSALS action type', () => {});

    it('should handle ADD_MODULE_TO_PROPOSAL action type', () => {
      const state = Map();
      const action = {
        id: 'module42',
        moduleInfo: {
          tokenCategories: [],
          voteType: 'tokens'
        },
        voteSpecTemplateId: 'template2',
        proposalId: 'proposal1',
        type: actionTypes.ADD_MODULE_TO_PROPOSAL
      };
      const expected = {
        module42: {
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          id: 'module42',
          isCustom: false,
          proposalId: 'proposal1',
          voteSpecTemplateId: 'template2'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UNDELETE_MODULE action type', () => {
      const state = fromJS({
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          voteSpecTemplateId: 'template2',
          proposalId: 'proposal1'
        }
      });
      const action = {
        id: 'module42',
        type: actionTypes.UNDELETE_MODULE
      };
      const expected = {
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          voteSpecTemplateId: 'template2',
          proposalId: 'proposal1'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle MARK_ALL_DEPENDENCIES_AS_CHANGED action type', () => {
      const state = fromJS({
        dep1: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          id: 'dep1',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1'
        },
        dep2: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          id: 'dep2',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal2'
        },
        dep3: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          isCustom: true,
          id: 'dep3',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal2'
        },
        template: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'template',
          voteSpecTemplateId: null,
          proposalId: null
        }
      });
      const action = {
        id: 'template',
        type: actionTypes.MARK_ALL_DEPENDENCIES_AS_CHANGED
      };
      const expected = {
        dep1: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          id: 'dep1',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1'
        },
        dep2: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          id: 'dep2',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal2'
        },
        dep3: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          isCustom: true,
          id: 'dep3',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal2'
        },
        template: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'template',
          voteSpecTemplateId: null,
          proposalId: null
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle CANCEL_MODULE_CUSTOMIZATION action type (choice gauge)', () => {
      const state = fromJS({
        customGauge: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          isCustom: true,
          isNumberGauge: false,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My custom instructions'
            }
          ],
          choices: ['custom-choice1', 'custom-choice2']
        },
        template: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          isNumberGauge: false,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'template',
          voteSpecTemplateId: null,
          proposalId: null,
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My template instructions'
            }
          ],
          choices: ['template-choice1']
        }
      });
      const action = {
        id: 'customGauge',
        type: actionTypes.CANCEL_MODULE_CUSTOMIZATION
      };
      const expected = {
        customGauge: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          isCustom: false,
          isNumberGauge: false,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My template instructions'
            }
          ]
        },
        template: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          isNumberGauge: false,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'template',
          voteSpecTemplateId: null,
          proposalId: null,
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My template instructions'
            }
          ],
          choices: ['template-choice1']
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle CANCEL_MODULE_CUSTOMIZATION action type (number gauge)', () => {
      const state = fromJS({
        customGauge: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          isCustom: true,
          isNumberGauge: true,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My custom instructions'
            }
          ],
          unit: 'custom unit',
          minimum: 0,
          maximum: 10
        },
        template: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          isNumberGauge: true,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'template',
          voteSpecTemplateId: null,
          proposalId: null,
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My template instructions'
            }
          ],
          unit: 'template unit',
          minimum: 100,
          maximum: 1000
        }
      });
      const action = {
        id: 'customGauge',
        type: actionTypes.CANCEL_MODULE_CUSTOMIZATION
      };
      const expected = {
        customGauge: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          isCustom: false,
          isNumberGauge: true,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My template instructions'
            }
          ],
          unit: 'template unit',
          minimum: 100,
          maximum: 1000
        },
        template: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          isNumberGauge: true,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'template',
          voteSpecTemplateId: null,
          proposalId: null,
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My template instructions'
            }
          ],
          unit: 'template unit',
          minimum: 100,
          maximum: 1000
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle CANCEL_MODULE_CUSTOMIZATION action type (change gauge type)', () => {
      const state = fromJS({
        customGauge: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          isCustom: true,
          isNumberGauge: true,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My custom instructions'
            }
          ],
          unit: 'custom unit',
          minimum: 0,
          maximum: 10
        },
        template: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          isNumberGauge: false,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'template',
          voteSpecTemplateId: null,
          proposalId: null,
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My template instructions'
            }
          ],
          choices: ['template-choice1']
        }
      });
      const action = {
        id: 'customGauge',
        type: actionTypes.CANCEL_MODULE_CUSTOMIZATION
      };
      const expected = {
        customGauge: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          isCustom: false,
          isNumberGauge: false,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My template instructions'
            }
          ]
        },
        template: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: true,
          isNumberGauge: false,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'template',
          voteSpecTemplateId: null,
          proposalId: null,
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My template instructions'
            }
          ],
          choices: ['template-choice1']
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_MODULE action type (number gauge)', () => {
      const state = fromJS({
        customGauge: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          isCustom: true,
          isNumberGauge: true,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'My custom instructions'
            }
          ],
          maximum: 10,
          minimum: 0,
          nbTicks: 8,
          unit: 'km',
          type: 'gauge'
        }
      });
      const action = {
        id: 'customGauge',
        info: {
          isCustom: true,
          isNumberGauge: true,
          instructions: 'New instructions',
          maximum: 2,
          minimum: 1,
          nbTicks: 9,
          type: 'gauge',
          unit: 'kms'
        },
        locale: 'en',
        type: actionTypes.UPDATE_VOTE_MODULE
      };
      const expected = {
        customGauge: {
          _hasChanged: true,
          _isNew: false,
          _toDelete: false,
          isCustom: true,
          isNumberGauge: true,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'New instructions'
            }
          ],
          maximum: 2,
          minimum: 1,
          unit: 'kms',
          nbTicks: 9,
          type: 'gauge'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_MODULE action type (text gauge)', () => {
      const state = fromJS({
        customGauge: {
          _hasChanged: false,
          _isNew: true,
          _toDelete: false,
          isCustom: false,
          isNumberGauge: false,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          type: 'gauge'
        }
      });
      const action = {
        id: 'customGauge',
        info: {
          isCustom: true,
          isNumberGauge: false,
          instructions: 'New instructions',
          choices: List.of(Map({ id: 'choice1', title: 'sensor' }), Map({ id: 'choice2', title: 'protocol' })),
          type: 'gauge'
        },
        locale: 'en',
        type: actionTypes.UPDATE_VOTE_MODULE
      };
      const expected = {
        customGauge: {
          _hasChanged: true,
          _isNew: true,
          _toDelete: false,
          isCustom: true,
          isNumberGauge: false,
          id: 'customGauge',
          voteSpecTemplateId: 'template',
          proposalId: 'proposal1',
          instructionsEntries: [
            {
              localeCode: 'en',
              value: 'New instructions'
            }
          ],
          type: 'gauge',
          choices: ['choice1', 'choice2']
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });
  });

  describe('gaugeChoicesById reducer', () => {
    const { gaugeChoicesById } = reducers;
    it('should handle UPDATE_VOTE_MODULE action', () => {
      const state = Map({
        m1Choice1: Map({
          id: 'm1Choice1',
          labelEntries: List(
            Map({
              localeCode: 'en',
              value: 'First choice'
            })
          )
        }),
        m1Choice2: Map({
          id: 'm1Choice2',
          labelEntries: List()
        }),
        m2Choice1: Map({
          id: 'm2Choice1',
          labelEntries: List()
        }),
        m3Choice1: Map({
          id: 'm3Choice1',
          labelEntries: List()
        })
      });
      const action = {
        id: 'm4',
        info: {
          isCustom: true,
          isNumberGauge: false,
          instructions: 'Module 4 instructions',
          choices: List.of(
            Map({
              id: 'm4Choice1',
              title: 'If we calculate the system, we can get to the XSS panel through the virtual CSS circuit!'
            }),
            Map({
              id: 'm4Choice2',
              title: 'Try to quantify the PCI matrix, maybe it will compress the 1080p monitor!'
            })
          ),
          type: 'gauge'
        },
        locale: 'en',
        type: actionTypes.UPDATE_VOTE_MODULE
      };
      const expected = Map({
        m1Choice1: Map({
          id: 'm1Choice1',
          labelEntries: List(
            Map({
              localeCode: 'en',
              value: 'First choice'
            })
          )
        }),
        m1Choice2: Map({
          id: 'm1Choice2',
          labelEntries: List()
        }),
        m2Choice1: Map({
          id: 'm2Choice1',
          labelEntries: List()
        }),
        m3Choice1: Map({
          id: 'm3Choice1',
          labelEntries: List()
        }),
        m4Choice1: Map({
          id: 'm4Choice1',
          labelEntries: List.of(
            Map({
              localeCode: 'en',
              value: 'If we calculate the system, we can get to the XSS panel through the virtual CSS circuit!'
            })
          )
        }),
        m4Choice2: Map({
          id: 'm4Choice2',
          labelEntries: List.of(
            Map({
              localeCode: 'en',
              value: 'Try to quantify the PCI matrix, maybe it will compress the 1080p monitor!'
            })
          )
        })
      });
      const actual = gaugeChoicesById(state, action);
      expect(actual).toEqual(expected);
    });
  });
});