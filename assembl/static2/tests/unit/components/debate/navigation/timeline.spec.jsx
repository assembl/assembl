import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTimeline } from '../../../../../js/app/components/debate/navigation/timeline';

describe('DumbTimeline component', () => {
  it('should match the DumbTimeline', () => {
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