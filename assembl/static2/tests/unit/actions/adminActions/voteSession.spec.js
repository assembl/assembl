import * as actions from '../../../../js/app/actions/adminActions/voteSession';

import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('voteSession admin actions', () => {
  describe('updateVoteSessionPageTitle action', () => {
    const { updateVoteSessionPageTitle } = actions;
    it('should return an UPDATE_VOTE_SESSION_PAGE_TITLE action type', () => {
      const actual = updateVoteSessionPageTitle('en', 'Title of the Vote Session Page in english');
      const expected = {
        locale: 'en',
        value: 'Title of the Vote Session Page in english',
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_TITLE
      };
      expect(actual).toEqual(expected);
    });
  });

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

  describe('updateVoteSessionPageSubtitle action', () => {
    const { updateVoteSessionPageSubtitle } = actions;
    it('should return an UPDATE_VOTE_SESSION_PAGE_SUBTITLE action type', () => {
      const actual = updateVoteSessionPageSubtitle('en', 'Subtitle of the Vote Session Page in english');
      const expected = {
        locale: 'en',
        value: 'Subtitle of the Vote Session Page in english',
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_SUBTITLE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateVoteSessionPageInstructionsTitle', () => {
    const { updateVoteSessionPageInstructionsTitle } = actions;
    it('should return an UPDATE_VOTE_SESSION_PAGE_SUBTITLE action type', () => {
      const actual = updateVoteSessionPageInstructionsTitle(
        'en',
        'Title of the instructions for the Vote Session Page in english'
      );
      const expected = {
        locale: 'en',
        value: 'Title of the instructions for the Vote Session Page in english',
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_TITLE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateVoteSessionPageInstructionsContent', () => {
    const { updateVoteSessionPageInstructionsContent } = actions;
    it('should return an UPDATE_VOTE_SESSION_PAGE_SUBTITLE action type', () => {
      const actual = updateVoteSessionPageInstructionsContent(
        'en',
        'Content of the instructions for the Vote Session Page in english'
      );
      const expected = {
        locale: 'en',
        value: 'Content of the instructions for the Vote Session Page in english',
        type: actionTypes.UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_CONTENT
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
});