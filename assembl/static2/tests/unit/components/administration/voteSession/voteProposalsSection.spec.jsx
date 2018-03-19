import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { List } from 'immutable';
import { voteProposalsInOrder } from './fakeData';

import { DumbVoteProposalsSection } from '../../../../../js/app/components/administration/voteSession/voteProposalsSection';

describe('VoteProposalsSection component', () => {
  const addVoteProposalSpy = jest.fn();
  const refetchVoteSessionSpy = jest.fn();

  it('should render a VoteProposalsSection component without any proposal', () => {
    const props = {
      voteProposals: List(),
      editLocale: 'fr',
      addVoteProposal: addVoteProposalSpy,
      refetchVoteSession: refetchVoteSessionSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteProposalsSection {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should render a voteProposalsSection with 2 proposals', () => {
    const props = {
      voteProposals: voteProposalsInOrder,
      editLocale: 'fr',
      addVoteProposal: addVoteProposalSpy,
      refetchVoteSession: refetchVoteSessionSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteProposalsSection {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});