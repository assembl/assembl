import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import InstructionView from '../../../../../js/app/components/debate/brightMirror/InstructionView';

describe('Bright Mirror page', () => {
  it('should match BrightMirror instruction snapshot', () => {
    const props = {
      announcementContent: {
        title: 'Instruction',
        body: 'Participez à la création de fiction'
      }
    };
    const rendered = ReactTestRenderer.create(<InstructionView {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});