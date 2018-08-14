import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import BrightMirrorInstructionView from '../../../js/app/components/debate/brightMirror/brightMirrorInstructionView';

describe('Bright Mirror page', () => {
  it('should match BrightMirror instruction snapshot', () => {
    const props = {
      announcementContent: {
        title: 'Instruction',
        body: 'Participez à la création de fiction'
      }
    };
    const rendered = ReactTestRenderer.create(<BrightMirrorInstructionView {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});