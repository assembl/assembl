import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { DumbTimelineSegment } from '../../../../../js/app/components/debate/navigation/timelineSegment';

configure({ adapter: new Adapter() });

jest.mock('../../../../../js/app/utils/utilityManager');
jest.mock('../../../../../js/app/utils/routeMap');

const timeline = [
  {
    identifier: 'foo',
    start: '2008-02-01T00:00:00Z',
    end: '2008-12-01T00:00:00Z',
    title: { entries: [{ en: 'Foo' }] }
  },
  {
    identifier: 'bar',
    start: '2009-02-01T00:00:00Z',
    end: '3110-12-01T00:00:00Z',
    title: { entries: [{ en: 'Bar' }] }
  }
];

const props = {
  client: { query: jest.fn() },
  title: 'Bar',
  startDate: 'date1',
  endDate: 'date2',
  phaseIdentifier: 'bar',
  phaseId: 'phaseBar',
  barPercent: 20,
  locale: 'en',
  onDeselect: jest.fn(),
  timeline: timeline,
  debate: {
    debateData: {
      slug: 'slug'
    }
  }
};

describe('DumbTimeline component', () => {
  it('should match the TimelineSegment', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<DumbTimelineSegment {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should match an active TimelineSegment', () => {
    const propsActive = {
      ...props,
      active: true
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbTimelineSegment {...propsActive} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should match the TimelineSegment', () => {
    const propsNotCompleted = {
      ...props,
      startDate: '2009-02-01T00:00:00Z',
      endDate: '3110-12-01T00:00:00Z'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbTimelineSegment {...propsNotCompleted} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should display a not started Phase', () => {
    const timelineNotStarted = [
      {
        identifier: 'foo',
        start: 'date1',
        end: 'date2',
        title: { entries: [{ en: 'Foo' }] }
      },
      {
        identifier: 'bar',
        start: '3000-02-01T00:00:00Z',
        end: '3110-12-01T00:00:00Z',
        title: { entries: [{ en: 'Bar' }] }
      }
    ];
    const propsNotStarted = {
      ...props,
      startDate: '3000-02-01T00:00:00Z',
      endDate: '3110-12-01T00:00:00Z',
      timeline: timelineNotStarted
    };
    const wrapper = mount(<DumbTimelineSegment {...propsNotStarted} />);
    const instance = wrapper.instance();
    expect(instance.phaseStatus).toEqual('notStarted');
  });
});