import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import SideMenuTree from '../../../../../js/app/components/synthesis/sideMenuTree';
import '../../../../helpers/setupTranslations';

describe('SideMenuTree component', () => {
  const indexGenerator = jest.fn(() => {});
  const commonProps = {
    rootIdea: {
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
    },
    synthesisPostId: '12345',
    subIdeas: [
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
      },
      {
        ancestors: [],
        id: '33333',
        img: {
          externalUrl: 'http://foo.com/bar'
        },
        numContributors: 5,
        numPosts: 50,
        phaseIdentifier: 'phaseId',
        posts: {
          edges: []
        },
        synthesisTitle: 'Okay idea',
        title: 'Very nice story'
      }
    ],
    index: 1,
    slug: 'felixdebate',
    indexGenerator: indexGenerator
  };
  it('should render a 1 level SideMenuTree component', () => {
    const props = {
      ...commonProps,
      parents: []
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<SideMenuTree {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  it('should render a 2 level SideMenuTree', () => {
    const props = {
      ...commonProps,
      parents: [1]
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<SideMenuTree {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});