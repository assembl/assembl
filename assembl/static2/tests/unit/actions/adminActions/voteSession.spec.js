// @flow
import { Map } from 'immutable';

import * as actions from '../../../../js/app/actions/adminActions/voteSession';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

// Mock createRandomId which is called in createVoteProposalAndModules
jest.mock('../../../../js/app/utils/globalFunctions', () => ({
  createRandomId: jest.fn(() => '1234567890')
}));

describe('Vote session administration actions', () => {
  describe('updateVoteSessionPageSeeCurrentVotes action false', () => {
    const { updateVoteSessionPageSeeCurrentVotes } = actions;
    it('should return an UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES action type', () => {
      const actual = updateVoteSessionPageSeeCurrentVotes(false);
      const expected = {
        value: false,
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateVoteSessionPageSeeCurrentVotes action true', () => {
    const { updateVoteSessionPageSeeCurrentVotes } = actions;
    it('should return an UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES action type', () => {
      const actual = updateVoteSessionPageSeeCurrentVotes(true);
      const expected = {
        value: true,
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateVoteSessionPagePropositionsTitle', () => {
    const { updateVoteSessionPagePropositionsTitle } = actions;
    it('should return an UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE action type', () => {
      const actual = updateVoteSessionPagePropositionsTitle(
        'en',
        'Title of the propositions section for the vote session page in english'
      );
      const expected = {
        locale: 'en',
        value: 'Title of the propositions section for the vote session page in english',
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('undeleteModule', () => {
    const { undeleteModule } = actions;
    it('should return an UNDELETE_MODULE action type', () => {
      const actual = undeleteModule('module42');
      const expected = {
        id: 'module42',
        type: actionTypes.UNDELETE_MODULE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('deleteVoteModule', () => {
    const { deleteVoteModule } = actions;
    it('should return an DELETE_VOTE_MODULE action type', () => {
      const actual = deleteVoteModule('module42');
      const expected = {
        id: 'module42',
        type: actionTypes.DELETE_VOTE_MODULE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('markAllDependenciesAsChanged', () => {
    const { markAllDependenciesAsChanged } = actions;
    it('should return a MARK_ALL_DEPENDENCIES_AS_CHANGED action', () => {
      const actual = markAllDependenciesAsChanged('myVoteSpecTemplate');
      const expected = {
        id: 'myVoteSpecTemplate',
        type: actionTypes.MARK_ALL_DEPENDENCIES_AS_CHANGED
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('setValidationErrors', () => {
    const { setValidationErrors } = actions;
    it('should return a SET_VALIDATION_ERRORS action', () => {
      const errors = {
        title: [
          {
            code: 'titleRequired',
            vars: {}
          }
        ],
        modules: [
          {
            code: 'atLeastOneModule',
            vars: { proposalIdx: '1' }
          }
        ]
      };
      const actual = setValidationErrors('my-item', errors);
      const expected = {
        errors: errors,
        id: 'my-item',
        type: actionTypes.SET_VALIDATION_ERRORS
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('cancelModuleCustomization', () => {
    const { cancelModuleCustomization } = actions;
    it('should return a CANCEL_MODULE_CUSTOMIZATION action', () => {
      const actual = cancelModuleCustomization('my-module');
      const expected = {
        id: 'my-module',
        type: actionTypes.CANCEL_MODULE_CUSTOMIZATION
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('cancelAllDependenciesCustomization action', () => {
    const { cancelAllDependenciesCustomization } = actions;
    it('should dispatch CANCEL_MODULE_CUSTOMIZATION action for each dependents of this template', () => {
      const actual = cancelAllDependenciesCustomization('myTemplate');
      const state = {
        admin: {
          voteSession: {
            modulesById: Map({
              myTemplate: Map({
                id: 'myTemplate',
                isCustom: false,
                voteSpecTemplateId: null
              }),
              otherTemplate: Map({
                id: 'otherTemplate',
                isCustom: false,
                voteSpecTemplateId: null
              }),
              dep1: Map({
                id: 'dep1',
                isCustom: true,
                voteSpecTemplateId: 'myTemplate'
              }),
              dep2: Map({
                id: 'dep2',
                isCustom: true,
                voteSpecTemplateId: 'myTemplate'
              }),
              otherCustom: Map({
                id: 'otherCustom',
                isCustom: true,
                voteSpecTemplateId: 'otherTemplate'
              }),
              nonCustom: Map({
                id: 'nonCustom',
                isCustom: false,
                voteSpecTemplateId: 'myTemplate'
              })
            })
          }
        }
      };
      const getState = () => state;
      const dispatchMock = jest.fn();
      actual(dispatchMock, getState);
      expect(dispatchMock.mock.calls.length).toEqual(3);
      expect(dispatchMock.mock.calls[0].length).toEqual(1);
      expect(dispatchMock.mock.calls[0][0]).toEqual({ id: 'dep1', type: 'CANCEL_MODULE_CUSTOMIZATION' });
      expect(dispatchMock.mock.calls[1][0]).toEqual({ id: 'dep2', type: 'CANCEL_MODULE_CUSTOMIZATION' });
    });
  });

  describe('updateVoteModule', () => {
    const { updateVoteModule } = actions;
    it('should return a UPDATE_VOTE_MODULE action', () => {
      const info = {
        instructions: 'My updated title',
        minimum: 0,
        maximum: 20,
        nbTicks: 10,
        unit: 'kms',
        type: 'gauge'
      };
      const actual = updateVoteModule('my-module', 'en', info);
      const expected = {
        id: 'my-module',
        info: {
          instructions: 'My updated title',
          minimum: 0,
          maximum: 20,
          nbTicks: 10,
          unit: 'kms',
          type: 'gauge'
        },
        locale: 'en',
        type: actionTypes.UPDATE_VOTE_MODULE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateVoteModules', () => {
    const { updateVoteModules } = actions;
    it('should return a UPDATE_VOTE_MODULES action', () => {
      const voteModules = [{ id: 'my-id-1' }, { id: 'my-id-2' }];

      const actual = updateVoteModules(voteModules);
      const expected = {
        voteModules: voteModules,
        type: actionTypes.UPDATE_VOTE_MODULES
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('createTokenVoteModule', () => {
    const { createTokenVoteModule } = actions;
    it('should return a CREATE_TOKEN_VOTE_MODULE action', () => {
      const actual = createTokenVoteModule('my-id');
      const expected = {
        id: 'my-id',
        type: actionTypes.CREATE_TOKEN_VOTE_MODULE
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('createGaugeVoteModule', () => {
    const { createGaugeVoteModule } = actions;
    it('should return a CREATE_GAUGE_VOTE_MODULE action', () => {
      const actual = createGaugeVoteModule('my-id');
      const expected = {
        id: 'my-id',
        type: actionTypes.CREATE_GAUGE_VOTE_MODULE
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateTokenVoteExclusiveCategory', () => {
    const { updateTokenVoteExclusiveCategory } = actions;
    it('should return a UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY action', () => {
      const actual = updateTokenVoteExclusiveCategory('my-id', true);
      const expected = {
        id: 'my-id',
        value: true,
        type: actionTypes.UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateTokenVoteInstructions', () => {
    const { updateTokenVoteInstructions } = actions;
    it('should return a UPDATE_TOKEN_VOTE_INSTRUCTIONS action', () => {
      const actual = updateTokenVoteInstructions('my-id', 'my-locale', 'my-value');
      const expected = {
        id: 'my-id',
        locale: 'my-locale',
        value: 'my-value',
        type: actionTypes.UPDATE_TOKEN_VOTE_INSTRUCTIONS
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('createTokenVoteCategory', () => {
    const { createTokenVoteCategory } = actions;
    it('should return a CREATE_TOKEN_VOTE_CATEGORY action', () => {
      const actual = createTokenVoteCategory('my-id', 'my-module-id');
      const expected = {
        id: 'my-id',
        moduleId: 'my-module-id',
        type: actionTypes.CREATE_TOKEN_VOTE_CATEGORY
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('deleteTokenVoteCategory', () => {
    const { deleteTokenVoteCategory } = actions;
    it('should return a DELETE_TOKEN_VOTE_CATEGORY action', () => {
      const actual = deleteTokenVoteCategory('my-module-id', 10);
      const expected = {
        moduleId: 'my-module-id',
        index: 10,
        type: actionTypes.DELETE_TOKEN_VOTE_CATEGORY
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateTokenVoteCategoryTitle', () => {
    const { updateTokenVoteCategoryTitle } = actions;
    it('should return a UPDATE_TOKEN_VOTE_CATEGORY_TITLE action', () => {
      const actual = updateTokenVoteCategoryTitle('my-id', 'my-locale', 'my-value', 'my-module-id');
      const expected = {
        id: 'my-id',
        locale: 'my-locale',
        value: 'my-value',
        moduleId: 'my-module-id',
        type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateTokenTotalNumber', () => {
    const { updateTokenTotalNumber } = actions;
    it('should return a UPDATE_TOKEN_TOTAL_NUMBER action', () => {
      const actual = updateTokenTotalNumber('my-id', 10, 'my-module-id');
      const expected = {
        id: 'my-id',
        value: 10,
        moduleId: 'my-module-id',
        type: actionTypes.UPDATE_TOKEN_TOTAL_NUMBER
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateTokenVoteCategoryColor', () => {
    const { updateTokenVoteCategoryColor } = actions;
    it('should return a UPDATE_TOKEN_VOTE_CATEGORY_COLOR action', () => {
      const actual = updateTokenVoteCategoryColor('my-id', 'my-value', 'my-module-id');
      const expected = {
        id: 'my-id',
        value: 'my-value',
        moduleId: 'my-module-id',
        type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_COLOR
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateGaugeVoteInstructions', () => {
    const { updateGaugeVoteInstructions } = actions;
    it('should return a UPDATE_GAUGE_VOTE_INSTRUCTIONS action', () => {
      const actual = updateGaugeVoteInstructions('my-id', 'my-locale', 'my-value');
      const expected = {
        id: 'my-id',
        locale: 'my-locale',
        value: 'my-value',
        type: actionTypes.UPDATE_GAUGE_VOTE_INSTRUCTIONS
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateGaugeVoteIsNumber', () => {
    const { updateGaugeVoteIsNumber } = actions;
    it('should return a UPDATE_GAUGE_VOTE_IS_NUMBER action', () => {
      const actual = updateGaugeVoteIsNumber('my-id', true);
      const expected = {
        id: 'my-id',
        value: true,
        type: actionTypes.UPDATE_GAUGE_VOTE_IS_NUMBER
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateGaugeVoteNbTicks', () => {
    const { updateGaugeVoteNbTicks } = actions;
    it('should return a UPDATE_GAUGE_VOTE_NUMBER_TICKS action', () => {
      const actual = updateGaugeVoteNbTicks('my-id', 10);
      const expected = {
        id: 'my-id',
        value: 10,
        type: actionTypes.UPDATE_GAUGE_VOTE_NUMBER_TICKS
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('createGaugeVoteChoice', () => {
    const { createGaugeVoteChoice } = actions;
    it('should return a CREATE_GAUGE_VOTE_CHOICE action', () => {
      const actual = createGaugeVoteChoice('my-module-id', 'my-id');
      const expected = {
        moduleId: 'my-module-id',
        id: 'my-id',
        type: actionTypes.CREATE_GAUGE_VOTE_CHOICE
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('deleteGaugeVoteChoice', () => {
    const { deleteGaugeVoteChoice } = actions;
    it('should return a DELETE_GAUGE_VOTE_CHOICE action', () => {
      const actual = deleteGaugeVoteChoice('my-module-id', 10);
      const expected = {
        moduleId: 'my-module-id',
        index: 10,
        type: actionTypes.DELETE_GAUGE_VOTE_CHOICE
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateGaugeVoteChoiceLabel', () => {
    const { updateGaugeVoteChoiceLabel } = actions;
    it('should return a UPDATE_GAUGE_VOTE_CHOICE_LABEL action', () => {
      const actual = updateGaugeVoteChoiceLabel('my-id', 'my-locale', 'my-value', 'my-module-id');
      const expected = {
        id: 'my-id',
        locale: 'my-locale',
        value: 'my-value',
        moduleId: 'my-module-id',
        type: actionTypes.UPDATE_GAUGE_VOTE_CHOICE_LABEL
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateGaugeMinimum', () => {
    const { updateGaugeMinimum } = actions;
    it('should return a UPDATE_GAUGE_MINIMUM action', () => {
      const actual = updateGaugeMinimum('my-id', 10);
      const expected = {
        id: 'my-id',
        value: 10,
        type: actionTypes.UPDATE_GAUGE_MINIMUM
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateGaugeMaximum', () => {
    const { updateGaugeMaximum } = actions;
    it('should return a UPDATE_GAUGE_MAXIMUM action', () => {
      const actual = updateGaugeMaximum('my-id', 10);
      const expected = {
        id: 'my-id',
        value: 10,
        type: actionTypes.UPDATE_GAUGE_MAXIMUM
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateGaugeUnit', () => {
    const { updateGaugeUnit } = actions;
    it('should return a UPDATE_GAUGE_UNIT action', () => {
      const actual = updateGaugeUnit('my-id', 'my-value');
      const expected = {
        id: 'my-id',
        value: 'my-value',
        type: actionTypes.UPDATE_GAUGE_UNIT
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateVoteSessionPage', () => {
    const { updateVoteSessionPage } = actions;
    it('should return a UPDATE_VOTE_SESSION_PAGE action', () => {
      const myObject = {
        id: 'my-id',
        seeCurrentVotes: true,
        propositionsSectionTitleEntries: ['proposition-1']
      };
      const actual = updateVoteSessionPage(myObject);
      const expected = {
        id: myObject.id,
        seeCurrentVotes: myObject.seeCurrentVotes,
        propositionsSectionTitleEntries: myObject.propositionsSectionTitleEntries,
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateVoteProposals', () => {
    const { updateVoteProposals } = actions;
    it('should return a UPDATE_VOTE_PROPOSALS action', () => {
      const myVoteProposalInfoArray = [{ id: 'my-id-1' }, { id: 'my-id-2' }];
      const actual = updateVoteProposals(myVoteProposalInfoArray);
      const expected = {
        voteProposals: myVoteProposalInfoArray,
        type: actionTypes.UPDATE_VOTE_PROPOSALS
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('createVoteProposal', () => {
    const { createVoteProposal } = actions;
    it('should return a CREATE_VOTE_PROPOSAL action', () => {
      const actual = createVoteProposal('my-id');
      const expected = {
        id: 'my-id',
        type: actionTypes.CREATE_VOTE_PROPOSAL
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('deleteVoteProposal', () => {
    const { deleteVoteProposal } = actions;
    it('should return a DELETE_VOTE_PROPOSAL action', () => {
      const actual = deleteVoteProposal('my-id');
      const expected = {
        id: 'my-id',
        type: actionTypes.DELETE_VOTE_PROPOSAL
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateVoteProposalTitle', () => {
    const { updateVoteProposalTitle } = actions;
    it('should return a UPDATE_VOTE_PROPOSAL_TITLE action', () => {
      const actual = updateVoteProposalTitle('my-id', 'my-locale', 'my-value');
      const expected = {
        id: 'my-id',
        locale: 'my-locale',
        value: 'my-value',
        type: actionTypes.UPDATE_VOTE_PROPOSAL_TITLE
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('updateVoteProposalDescription', () => {
    const { updateVoteProposalDescription } = actions;
    it('should return a UPDATE_VOTE_PROPOSAL_DESCRIPTION action', () => {
      const actual = updateVoteProposalDescription('my-id', 'my-locale', 'my-value');
      const expected = {
        id: 'my-id',
        locale: 'my-locale',
        value: 'my-value',
        type: actionTypes.UPDATE_VOTE_PROPOSAL_DESCRIPTION
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('moveProposalUp', () => {
    const { moveProposalUp } = actions;
    it('should return a MOVE_PROPOSAL_UP action', () => {
      const actual = moveProposalUp('my-id');
      const expected = {
        id: 'my-id',
        type: actionTypes.MOVE_PROPOSAL_UP
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('moveProposalDown', () => {
    const { moveProposalDown } = actions;
    it('should return a MOVE_PROPOSAL_DOWN action', () => {
      const actual = moveProposalDown('my-id');
      const expected = {
        id: 'my-id',
        type: actionTypes.MOVE_PROPOSAL_DOWN
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('addModuleToProposal', () => {
    const { addModuleToProposal } = actions;
    it('should return a ADD_MODULE_TO_PROPOSAL action', () => {
      const actual = addModuleToProposal('my-id', 'my-proposal-id', 'my-vote-spec-template-id');
      const expected = {
        id: 'my-id',
        proposalId: 'my-proposal-id',
        voteSpecTemplateId: 'my-vote-spec-template-id',
        type: actionTypes.ADD_MODULE_TO_PROPOSAL
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('createVoteProposalAndModules', () => {
    const { createVoteProposalAndModules } = actions;
    it('should return a ADD_MODULE_TO_PROPOSAL action', () => {
      const actual = createVoteProposalAndModules('my-id');
      const state = {
        admin: {
          voteSession: {
            modulesInOrder: Map({
              myTemplate: Map({
                id: 'myTemplate',
                isCustom: false,
                voteSpecTemplateId: null
              }),
              otherTemplate: Map({
                id: 'otherTemplate',
                isCustom: false,
                voteSpecTemplateId: null
              }),
              dep1: Map({
                id: 'dep1',
                isCustom: true,
                voteSpecTemplateId: 'myTemplate'
              }),
              dep2: Map({
                id: 'dep2',
                isCustom: true,
                voteSpecTemplateId: 'myTemplate'
              }),
              otherCustom: Map({
                id: 'otherCustom',
                isCustom: true,
                voteSpecTemplateId: 'otherTemplate'
              }),
              nonCustom: Map({
                id: 'nonCustom',
                isCustom: false,
                voteSpecTemplateId: 'myTemplate'
              })
            })
          }
        }
      };

      const dispatch = jest.fn();
      const getState = jest.fn(() => state);

      actual(dispatch, getState);
      expect(dispatch.mock.calls.length).toEqual(7);

      expect(dispatch.mock.calls[0].length).toEqual(1);
      expect(dispatch.mock.calls[0][0]).toEqual({
        id: 'my-id',
        type: 'CREATE_VOTE_PROPOSAL'
      });
      expect(dispatch.mock.calls[1].length).toEqual(1);
      expect(dispatch.mock.calls[1][0]).toEqual({
        id: '1234567890',
        proposalId: 'my-id',
        voteSpecTemplateId: Map({
          id: 'myTemplate',
          isCustom: false,
          voteSpecTemplateId: null
        }),
        type: 'ADD_MODULE_TO_PROPOSAL'
      });
    });
  });
});