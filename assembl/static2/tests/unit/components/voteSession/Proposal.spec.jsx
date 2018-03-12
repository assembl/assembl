import React from 'react';
import renderer from 'react-test-renderer';

import Proposal from '../../../../js/app/components/voteSession/proposal';
import * as fakeData from './fakeData';

describe('Proposal component', () => {
  const voteForProposalSpy = jest.fn();
  const voteForProposalGaugeSpy = jest.fn();
  it('should match Proposal snapshot', () => {
    const { remainingTokensByCategory, userTokenVotes, tokenVoteModule, textGaugeModule } = fakeData;
    const props = {
      description: 'Try to override the CSS transmitter, maybe it will program the solid state program!',
      id: 'my-proposal',
      modules: [tokenVoteModule, textGaugeModule],
      remainingTokensByCategory: remainingTokensByCategory,
      title: 'Use the online USB transmitter, then you can reboot the cross-platform application!',
      userTokenVotes: userTokenVotes,
      voteForProposal: voteForProposalSpy,
      voteForProposalGauge: voteForProposalGaugeSpy
    };
    const rendered = renderer.create(<Proposal {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});