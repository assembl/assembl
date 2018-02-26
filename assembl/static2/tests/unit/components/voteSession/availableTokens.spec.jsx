import React from 'react';
import renderer from 'react-test-renderer';
import { Map } from 'immutable';

import AvailableTokens from '../../../../js/app/components/voteSession/availableTokens';

const tokenCategories = [
  {
    color: '#228866',
    id: 'positive',
    title: 'Positive'
  },
  {
    color: '#882222',
    id: 'negative',
    title: 'Negative'
  }
];

describe('AvailableTokens component', () => {
  it('should match AvailableTokens snapshot (non sticky version)', () => {
    const props = {
      remainingTokensByCategory: Map({
        positive: 3,
        negative: 10
      }),
      sticky: false,
      tokenCategories: tokenCategories
    };
    const rendered = renderer.create(<AvailableTokens {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should match AvailableTokens snapshot (sticky version)', () => {
    const props = {
      remainingTokensByCategory: Map({
        positive: 3,
        negative: 10
      }),
      sticky: true,
      tokenCategories: tokenCategories
    };
    const rendered = renderer.create(<AvailableTokens {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});