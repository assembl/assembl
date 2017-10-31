import React from 'react';
import renderer from 'react-test-renderer';

import { Synthesis } from '../../../js/app/pages/synthesis';

describe('Syntheses component', () => {
  it('should match Syntheses snapshot', () => {
    const props = {
      synthesis: {
        id: 'fooId',
        subject: 'Foo',
        imgUrl: 'http://foo.com/bar'
      }
    };
    const rendered = renderer.create(<Synthesis {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});