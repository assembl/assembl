import React from 'react';
import renderer from 'react-test-renderer';

import { DumbSynthesis } from '../../../js/app/pages/synthesis';

describe('Synthesis component', () => {
  it('should match Synthesis snapshot', () => {
    const props = {
      routeParams: { slug: 'slugId' },
      synthesis: {
        id: 'fooId',
        subject: 'Foo',
        imgUrl: 'http://foo.com/foo',
        ideas: [
          {
            id: 'barId',
            title: 'Bar',
            imgUrl: 'http://foo.com/bar',
            synthesisTitle: 'Foo',
            numContributors: 0,
            numPosts: 0,
            posts: { edges: [] },
            phaseIdentifier: 'paseId'
          }
        ]
      }
    };
    const rendered = renderer.create(<DumbSynthesis {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});