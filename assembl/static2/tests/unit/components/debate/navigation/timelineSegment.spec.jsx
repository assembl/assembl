import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTimelineSegment } from '../../../../../js/app/components/debate/navigation/timelineSegment';

describe('DumbTimeline component', () => {
  it('should match the TimelineSegment', () => {
    const timeline = [
      {
        identifier: 'foo',
        start: 'date1',
        end: 'date2',
        title: { entries: [{ en: 'Foo' }] }
      },
      {
        identifier: 'bar',
        start: 'date1Bar',
        end: 'date2Bar',
        title: { entries: [{ en: 'Bar' }] }
      }
    ];
    const props = {
      client: { query: () => {} },
      title: {
        entries: [{ en: 'Foo' }]
      },
      startDate: 'date1',
      endDate: 'date2',
      phaseIdentifier: 'foo',
      phaseId: 'phaseFoo',
      barPercent: 20,
      locale: 'en',
      debate: {
        debateData: {
          slug: 'slug',
          timeline: timeline
        }
      }
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbTimelineSegment {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
  it('should match an active TimelineSegment', () => {
    const timeline = [
      {
        identifier: 'foo',
        start: 'date1',
        end: 'date2',
        title: { entries: [{ en: 'Foo' }] }
      },
      {
        identifier: 'bar',
        start: 'date1Bar',
        end: 'date2Bar',
        title: { entries: [{ en: 'Bar' }] }
      }
    ];
    const props = {
      active: true,
      client: { query: () => {} },
      title: {
        entries: [{ en: 'Foo' }]
      },
      startDate: 'date1',
      endDate: 'date2',
      phaseIdentifier: 'foo',
      phaseId: 'phaseFoo',
      barPercent: 20,
      locale: 'en',
      debate: {
        debateData: {
          slug: 'slug',
          timeline: timeline
        }
      }
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbTimelineSegment {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});