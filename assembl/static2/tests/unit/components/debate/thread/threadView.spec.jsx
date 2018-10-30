import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import ThreadView from '../../../../../js/app/components/debate/thread/threadView';

const timeline = [
  {
    identifier: 'foo',
    id: 'FooID',
    start: 'date1',
    end: 'date2',
    title: { entries: [{ en: 'Foo' }] }
  }
];

const props = {
  isUserConnected: true,
  contentLocaleMapping: null,
  refetchIdea: jest.fn(),
  lang: 'fr',
  noRowsRenderer: null,
  posts: [],
  initialRowIndex: 0,
  identifier: 'foo',
  phaseId: 'FooID',
  timeline: timeline
};

describe('ThreadView component', () => {
  it('should render a ThreadView without the TopPostForm', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<ThreadView {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should render a TopPostForm', () => {
    const timelineCompleted = [
      {
        identifier: 'foo',
        id: 'FooID',
        start: 'date1',
        end: '3110-01-01T00:00:00Z',
        title: { entries: [{ en: 'Foo' }] }
      }
    ];

    const propsCompleted = {
      ...props,
      isUserConnected: false,
      timeline: timelineCompleted
    };
    const renderer = new ShallowRenderer();
    renderer.render(<ThreadView {...propsCompleted} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});