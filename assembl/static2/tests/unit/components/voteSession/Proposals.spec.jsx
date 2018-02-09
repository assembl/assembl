import React from 'react';
import renderer from 'react-test-renderer';

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
              id: '123',
              title: 'Positive',
              totalNumber: 5
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
      ]
    };
    const rendered = renderer.create(<Proposals {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});