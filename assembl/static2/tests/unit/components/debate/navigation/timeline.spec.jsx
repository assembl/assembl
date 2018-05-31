import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTimeline } from '../../../../../js/app/components/debate/navigation/timeline';

describe('DumbTimeline component', () => {
  it('should match the DumbTimeline', () => {
    const timeline = [
      {
        identifier: 'foo',
        start: '1900-01-01T02:00:00Z',
        end: '2000-01-01T00:00:00Z',
        title: { entries: [{ en: 'Foo' }] }
      },
      {
        identifier: 'bar',
        start: '2001-01-01T02:00:00Z',
        end: '2010-01-01T00:00:00Z',
        title: { entries: [{ en: 'Bar' }] }
      }
    ];
    const props = {
      identifier: 'survey',
      showNavigation: true,
      debate: {
        debateData: {
          slug: 'slug',
          timeline: timeline
        }
      }
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbTimeline {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});