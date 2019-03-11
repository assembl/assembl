import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbMenuItem } from '../../../../../js/app/components/debate/navigation/menuItem';

describe('DumbMenuItem component', () => {
  it('should match a selected menu item', () => {
    const props = {
      item: {
        id: 'fooId',
        title: 'Foo',
        img: {
          externalUrl: 'https://foo.bar/img'
        },
        numContributors: 10,
        numPosts: 123,
        numVotes: 0,
        messageViewOverride: 'thread'
      },
      identifier: 'survey',
      selected: true,
      hasSubItems: true,
      slug: 'slug'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbMenuItem {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should match a not selected menu item', () => {
    const props = {
      item: {
        id: 'fooId',
        title: 'Foo',
        img: {
          externalUrl: 'https://foo.bar/img'
        },
        numContributors: 10,
        numPosts: 123,
        numVotes: 0,
        messageViewOverride: 'thread'
      },
      identifier: 'survey',
      selected: false,
      hasSubItems: true,
      slug: 'slug'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbMenuItem {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should match a selected menu item of type vote session', () => {
    const props = {
      item: {
        id: 'fooId',
        title: 'Foo',
        img: {
          externalUrl: 'https://foo.bar/img'
        },
        numContributors: 10,
        numPosts: 0,
        numVotes: 123,
        messageViewOverride: 'voteSession'
      },
      identifier: 'survey',
      selected: true,
      hasSubItems: true,
      slug: 'slug'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbMenuItem {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});