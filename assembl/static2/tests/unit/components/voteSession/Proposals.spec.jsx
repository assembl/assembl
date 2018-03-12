import React from 'react';
import renderer from 'react-test-renderer';

import Proposals from '../../../../js/app/components/voteSession/proposals';
import * as fakeData from './fakeData';

describe('Proposals component', () => {
  it('should match Proposals snapshot', () => {
    const { proposals, remainingTokensByCategory, userGaugeVotes, userTokenVotes } = fakeData;
    const props = {
      proposals: proposals,
      seeCurrentVotes: true,
      remainingTokensByCategory: remainingTokensByCategory,
      userGaugeVotes: userGaugeVotes,
      userTokenVotes: userTokenVotes
    };
    const rendered = renderer.create(<Proposals {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});