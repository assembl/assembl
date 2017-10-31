import React from 'react';
import renderer from 'react-test-renderer';

import { DumbSyntheses } from '../../../js/app/pages/syntheses';

describe('Syntheses component', () => {
  it('should match Syntheses snapshot', () => {
    const props = {
      data: {
        loading: false,
        syntheses: [
          {
            id: 'fooId',
            subject: 'Foo',
            imgUrl: 'http://foo.com/bar'
          },
          {
            id: 'barId',
            subject: 'Bar',
            imgUrl: 'http://foo.com/bar'
          }
        ]
      },
      slug: 'fooslug'
    };
    const rendered = renderer.create(<DumbSyntheses {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});