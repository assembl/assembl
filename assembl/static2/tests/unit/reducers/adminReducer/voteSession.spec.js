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
          seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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

    it('should handle UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES action type', () => {
      const oldState = fromJS({
        hasChanged: false,
        seeCurrentVotes: false,
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
        seeCurrentVotes: true,
        id: '',
        titleEntries: [{ localeCode: 'fr', value: 'Titre en français' }, { localeCode: 'en', value: 'Title in english' }],
        subTitleEntries: [],
        instructionsSectionTitleEntries: [],
        instructionsSectionContentEntries: [],
        propositionsSectionTitleEntries: [],
        headerImage: { externalUrl: '', mimeType: '', title: '' }
      });
      const action = {
        value: true,
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES
      };
      expect(voteSessionPage(oldState, action)).toEqual(expected);
    });

    it('should handle UPDATE_VOTE_SESSION_PAGE_IMAGE action type', () => {
      const oldState = fromJS({
        hasChanged: false,
        seeCurrentVotes: false,
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
        seeCurrentVotes: false,
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
        moduleTemplateId: 'template2',
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

    it('should handle DELETE_VOTE_MODULE action type', () => {
      const state = fromJS({
        module42: {
          _hasChanged: false,
          _isNew: false,
          _toDelete: false,
          tokenCategories: [],
          voteType: 'tokens',
          id: 'module42',
          moduleTemplateId: 'template2',
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
          moduleTemplateId: 'template2',
          proposalId: 'proposal1'
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
          moduleTemplateId: 'template2',
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
          moduleTemplateId: 'template2',
          proposalId: 'proposal1'
        }
      };
      const actual = modulesById(state, action);
      expect(actual.toJS()).toEqual(expected);
    });

    it('should handle UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY action type', () => {
      const state = fromJS({
        module42: {
          _hasChanged: false,
          isNew: false,
          toDelete: false,
          tokenCategories: [
            fromJS({
              id: 'token1',
              titleEntries: [],
              totalNumber: 10,
              color: 'green'
            }),
            fromJS({
              id: 'token2',
              titleEntries: [],
              totalNumber: 5,
              color: 'red'
            })
          ],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          moduleTemplateId: 'template2',
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
          _hasChanged: false,
          isNew: false,
          toDelete: false,
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
          moduleTemplateId: 'template2',
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
          isNew: false,
          toDelete: false,
          tokenCategories: [],
          instructionsEntries: fromJS([{ localeCode: 'en', value: 'Please vote guys' }]),
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          moduleTemplateId: 'template2',
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
          _hasChanged: false,
          isNew: false,
          toDelete: false,
          tokenCategories: [],
          instructionsEntries: [{ localeCode: 'en', value: 'Actually do not vote guys' }],
          exclusiveCategories: false,
          votetype: 'tokens',
          id: 'module42',
          moduleTemplateId: 'template2',
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
          isNew: false,
          toDelete: false,
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
        parentId: 'module42',
        type: actionTypes.CREATE_TOKEN_VOTE_CATEGORY
      };
      const expected = {
        module42: {
          _hasChanged: false,
          isNew: false,
          toDelete: false,
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
          isNew: false,
          toDelete: false,
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
        id: 'module42',
        index: 1,
        type: actionTypes.DELETE_TOKEN_VOTE_CATEGORY
      };
      const expected = {
        module42: {
          _hasChanged: false,
          isNew: false,
          toDelete: false,
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
    // THIS ONE IS NOT WORKING YET

    // it('should handle UPDATE_TOKEN_VOTE_CATEGORY_TITLE action type', () => {
    //   const state = fromJS({
    //     module42: {
    //       _hasChanged: false,
    //       isNew: false,
    //       toDelete: false,
    //       tokenCategories: fromJS([
    //         {
    //           id: 'token1',
    //           titleEntries: [{ localeCode: 'en', value: 'The first token' }],
    //           totalNumber: 10,
    //           color: 'green'
    //         }
    //       ]),
    //       voteSpecTemplateId: '12345',
    //       instructionsEntries: ['token1'],
    //       exclusiveCategories: false,
    //       votetype: 'tokens',
    //       id: 'module42',
    //       proposalId: 'proposal3'
    //     }
    //   });
    //   const action = {
    //     id: 'token1',
    //     locale: 'en',
    //     value: 'The amazing token',
    //     type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE
    //   };
    //   const expected = {
    //     module42: {
    //       _hasChanged: false,
    //       isNew: false,
    //       toDelete: false,
    //       tokenCategories: [
    //         {
    //           id: 'token1',
    //           titleEntries: [{ localeCode: 'en', value: 'The amazing token' }],
    //           totalNumber: 10,
    //           color: 'green'
    //         }
    //       ],
    //       voteSpecTemplateId: '12345',
    //       instructionsEntries: ['token1'],
    //       exclusiveCategories: false,
    //       votetype: 'tokens',
    //       id: 'module42',
    //       proposalId: 'proposal3'
    //     }
    //   };
    //   const actual = modulesById(state, action);
    //   expect(actual.toJS()).toEqual(expected);
    // });
  });
});