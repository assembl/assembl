import React from 'react';
import renderer from 'react-test-renderer';
import { Map } from 'immutable';

import AvailableTokens from '../../../../js/app/components/voteSession/availableTokens';
import { tokenCategories } from './fakeData';

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

  it('should match AvailableTokens snapshot (non sticky version with more than 2 categories)', () => {
    const fourTokenCategories = [
      {
        color: '#933',
        id: 'category1',
        title: 'One'
      },
      {
        color: '#AB0',
        id: 'category2',
        title: 'Two'
      },
      {
        color: '#999',
        id: 'category3',
        title: 'Three'
      },
      {
        color: '#049',
        id: 'category4',
        title: 'Four'
      }
    ];
    const props = {
      remainingTokensByCategory: Map({
        category1: 3,
        category4: 10
      }),
      sticky: false,
      tokenCategories: fourTokenCategories
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