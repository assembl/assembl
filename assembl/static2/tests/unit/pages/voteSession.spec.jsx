import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbVoteSession } from '../../../js/app/pages/voteSession';

describe('VoteSession component', () => {
  it('should match VoteSession snapshot with empty modules and proposals', () => {
    const voteForProposalSpy = jest.fn();
    const props = {
      title: 'Phase de vote à la majorité et estimation multicritère',
      subTitle: 'Maintenant il faut voter.',
      headerImageUrl: 'foo.jpg',
      instructionsSectionTitle: 'Instructions de la phase de vote',
      instructionsSectionContent: '',
      modules: [],
      propositionsSectionTitle: 'Vote sur 0 propositions',
      proposals: [],
      voteForProposal: voteForProposalSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteSession {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match VoteSession snapshot', () => {
    const voteForProposalSpy = jest.fn();
    const props = {
      title: 'Phase de vote à la majorité et estimation multicritère',
      subTitle: 'Maintenant il faut voter.',
      headerImageUrl: 'foo.jpg',
      instructionsSectionTitle: 'Instructions de la phase de vote',
      instructionsSectionContent: 'Elisez les meilleurs propositions, vous avez 8 jetons pour et 3 jetons contre',
      modules: [
        {
          tokenCategories: [
            {
              color: '#117711',
              id: 'negative',
              title: 'Negative'
            },
            {
              color: '#881111',
              id: 'positive',
              title: 'Positive'
            }
          ],
          voteType: 'token_vote_specification'
        }
      ],
      propositionsSectionTitle: 'Vote sur 10 propositions',
      proposals: [
        { id: 'foo', title: 'Foo', description: 'You can\'t hack the alarm without connecting the primary AGP microchip!' }
      ],
      voteForProposal: voteForProposalSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteSession {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});