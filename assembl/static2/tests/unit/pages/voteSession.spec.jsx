import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import * as fakeData from '../components/voteSession/fakeData';
import { DumbVoteSession } from '../../../js/app/pages/voteSession';

describe('VoteSession component', () => {
  it('should match VoteSession snapshot with empty modules and proposals', () => {
    const props = {
      title: 'Phase de vote à la majorité et estimation multicritère',
      seeCurrentVotes: true,
      subTitle: 'Maintenant il faut voter.',
      headerImageUrl: 'foo.jpg',
      instructionsSectionTitle: 'Instructions de la phase de vote',
      instructionsSectionContent: '',
      numParticipants: 0,
      modules: [],
      phaseId: 'my-phase-id',
      propositionsSectionTitle: 'Vote sur 0 propositions',
      proposals: [],
      randomProposals: []
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteSession {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match VoteSession snapshot', () => {
    const { proposals } = fakeData;
    const props = {
      title: 'Phase de vote à la majorité et estimation multicritère',
      seeCurrentVotes: true,
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
              title: 'Negative',
              totalNumber: 10
            },
            {
              color: '#881111',
              id: 'positive',
              title: 'Positive',
              totalNumber: 8
            }
          ],
          voteType: 'token_vote_specification'
        }
      ],
      numParticipants: 2,
      phaseId: 'my-phase-id',
      propositionsSectionTitle: 'Vote sur 10 propositions',
      proposals: proposals,
      randomProposals: proposals
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteSession {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});