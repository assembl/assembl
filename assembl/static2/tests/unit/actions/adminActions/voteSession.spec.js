import { Map } from 'immutable';

import * as actions from '../../../../js/app/actions/adminActions/voteSession';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

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

describe('updateVoteSessionHeaderImage', () => {
  const { updateVoteSessionHeaderImage } = actions;
  it('should return an UPDATE_VOTE_SESSION_PAGE_IMAGE action type', () => {
    const actual = updateVoteSessionHeaderImage({ name: 'foo.jpg', type: 'image/jpeg' });
    const expected = {
      value: { name: 'foo.jpg', type: 'image/jpeg' },
      type: actionTypes.UPDATE_VOTE_SESSION_PAGE_IMAGE
    };
    expect(actual).toEqual(expected);
  });
});

describe('undeleteModule', () => {
  const { undeleteModule } = actions;
  it('should return an UPDATE_VOTE_SESSION_PAGE_IMAGE action type', () => {
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