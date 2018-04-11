import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import TokenVoteForProposal from '../../../../js/app/components/voteSession/tokenVoteForProposal';
import * as fakeData from './fakeData';
import '../../../helpers/setupTranslations';

describe('TokenVoteForProposal component', () => {
  const { proposal1Votes, remainingTokensByCategory, tokenCategories } = fakeData;
  it('should match TokenVoteForProposal snapshot', () => {
    const voteForProposalSpy = jest.fn();
    const props = {
      exclusiveCategories: false,
      instructions: 'You can\'t bypass the microchip without backing up the open-source SMTP port!',
      proposalId: 'proposal-1',
      remainingTokensByCategory: remainingTokensByCategory,
      tokenCategories: tokenCategories,
      userTokenVotesForProposal: proposal1Votes,
      voteForProposal: voteForProposalSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<TokenVoteForProposal {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match TokenVoteForProposal with exclusive categories snapshot', () => {
    const voteForProposalSpy = jest.fn();
    const props = {
      exclusiveCategories: true,
      instructions: 'You can\'t bypass the microchip without backing up the open-source SMTP port!',
      proposalId: 'proposal-1',
      remainingTokensByCategory: remainingTokensByCategory,
      tokenCategories: tokenCategories,
      userTokenVotesForProposal: proposal1Votes,
      voteForProposal: voteForProposalSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<TokenVoteForProposal {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});