import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTimelineSegmentMenu } from '../../../../../js/app/components/debate/navigation/timelineSegmentMenu';

describe('DumbTimelineSegmentMenu component', () => {
  it('should match the DumbTimelineSegmentMenu', () => {
    const props = {
      title: {
        entries: [{ en: 'Foo' }]
      },
      startDate: 'date1',
      endDate: 'date2',
      phaseIdentifier: 'foo',
      phaseId: 'phaseFoo',
      locale: 'en'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbTimelineSegmentMenu {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});