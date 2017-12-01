import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbSynthesis } from '../../../js/app/pages/synthesis';

describe('Synthesis component', () => {
  it('should match Synthesis snapshot', () => {
    const props = {
      routeParams: { slug: 'slugId' },
      // TODO update this to reflect query change. Changing this
      // for now gives cryptic node error
      synthesis: {
        id: 'fooId',
        subject: 'Foo',
        img: { externalUrl: 'http://foo.com/foo' },
        ideas: [
          {
            id: 'barId',
            title: 'Bar',
            img: { externalUrl: 'http://foo.com/bar' },
            synthesisTitle: 'Foo',
            numContributors: 0,
            numPosts: 0,
            posts: { edges: [] },
            phaseIdentifier: 'paseId',
            ancestors: []
          }
        ]
      }
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbSynthesis {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});