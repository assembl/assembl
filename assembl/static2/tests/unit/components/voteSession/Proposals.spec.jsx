import React from 'react';
import renderer from 'react-test-renderer';
import { Map } from 'immutable';

import Proposals from '../../../../js/app/components/voteSession/proposals';

describe('Proposals component', () => {
  it('should match Proposals snapshot', () => {
    const props = {
      modules: [
        {
          id: 'XYZ',
          instructions: 'If we generate the feed, we can get to the AGP driver through the primary ADP interface!',
          tokenCategories: [
            {
              color: '#226622',
              id: 'positive',
              title: 'Positive',
              totalNumber: 5
            },
            {
              color: '#771122',
              id: 'negative',
              title: 'Negative',
              totalNumber: 4
            }
          ],
          voteType: 'token_vote_specification'
        },
        {
          id: 'ABC',
          instructions: 'I\'ll generate the mobile SMS bus, that should microchip the TCP matrix!',
          voteType: 'gauge_vote_specification'
        }
      ],
      proposals: [
        { id: 'foo', title: 'Foo', description: 'You can\'t hack the alarm without connecting the primary AGP microchip!' },
        {
          id: 'bar',
          title: 'Bar',
          description: 'I\'ll input the multi-byte SAS monitor, that should bandwidth the USB microchip!'
        }
      ],
      remainingTokensByCategory: Map({
        negative: 4,
        positive: 2
      }),
      tokenVotes: Map({
        foo: Map({
          positive: 2,
          negative: 1
        })
      })
    };
    const rendered = renderer.create(<Proposals {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});