import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbVoteSession } from '../../../js/app/pages/voteSession';

describe('VoteSession component', () => {
  it('should match VoteSession snapshot when vote session is not configured', () => {
    const props = {
      title: '',
      subTitle: '',
      headerImageUrl: '',
      instructionsSectionTitle: '',
      instructionsSectionContent: '',
      modules: [],
      propositionsSectionTitle: '',
      proposals: []
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteSession {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match VoteSession snapshot with empty modules and proposals', () => {
    const props = {
      title: 'Phase de vote à la majorité et estimation multicritère',
      subTitle: 'Maintenant il faut voter.',
      headerImageUrl: 'foo.jpg',
      instructionsSectionTitle: 'Instructions de la phase de vote',
      instructionsSectionContent: '',
      modules: [],
      propositionsSectionTitle: 'Vote sur 0 propositions',
      proposals: []
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteSession {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match VoteSession snapshot', () => {
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
      propositionsSectionTitle: 'Vote sur 10 propositions',
      proposals: [
        { id: 'foo', title: 'Foo', description: 'You can\'t hack the alarm without connecting the primary AGP microchip!' }
      ]
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteSession {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});