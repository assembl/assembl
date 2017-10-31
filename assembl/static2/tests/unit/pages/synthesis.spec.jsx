import React from 'react';
import renderer from 'react-test-renderer';

import { DumbSynthesis } from '../../../js/app/pages/synthesis';

describe('Syntheses component', () => {
  it('should match Syntheses snapshot', () => {
    const props = {
      data: {
        loading: false,
        synthesis: {
          id: 'fooId',
          subject: 'Foo',
          imgUrl: 'http://foo.com/bar'
        }
      }
    };
    const rendered = renderer.create(<DumbSynthesis {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});