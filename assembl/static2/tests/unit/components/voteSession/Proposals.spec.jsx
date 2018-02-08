import React from 'react';
import renderer from 'react-test-renderer';

import Proposals from '../../../../js/app/components/voteSession/proposals';

describe('Proposals component', () => {
  it('should match Proposals snapshot', () => {
    const props = {
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