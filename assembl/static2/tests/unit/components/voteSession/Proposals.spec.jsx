import React from 'react';
import renderer from 'react-test-renderer';

import Proposals from '../../../../js/app/components/voteSession/proposals';
import * as fakeData from './fakeData';

describe('Proposals component', () => {
  it('should match Proposals snapshot', () => {
    const { proposals, remainingTokensByCategory, tokenVoteModule, textGaugeModule, tokenVotes } = fakeData;
    const props = {
      modules: [tokenVoteModule, textGaugeModule],
      proposals: proposals,
      remainingTokensByCategory: remainingTokensByCategory,
      tokenVotes: tokenVotes
    };
    const rendered = renderer.create(<Proposals {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});