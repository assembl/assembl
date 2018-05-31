import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import SideMenu from '../../../../../js/app/components/synthesis/sideMenu';

describe('SideMenu component', () => {
  it('should render a SideMenu component', () => {
    const props = {
      rootIdeas: [
        {
          ancestors: [],
          id: '2222222',
          img: {
            externalUrl: 'http://foo.com/bar'
          },
          numContributors: 10,
          numPosts: 100,
          phaseIdentifier: 'phaseId',
          posts: {
            edges: []
          },
          synthesisTitle: 'Intersting idea',
          title: 'Cool story'
        }
      ],
      descendants: [
        {
          ancestors: [],
          id: '33333',
          img: {
            externalUrl: 'http://foo.com/bar'
          },
          numContributors: 5,
          numPosts: 60,
          phaseIdentifier: 'phaseId',
          posts: {
            edges: []
          },
          synthesisTitle: 'Very intersting idea',
          title: 'Super cool story'
        }
      ],
      synthesisPostId: '5667',
      show: true
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<SideMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});