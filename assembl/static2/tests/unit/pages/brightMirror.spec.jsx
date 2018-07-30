import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import BrightMirror from '../../../js/app/pages/brightMirror';

describe('Bright Mirror page', () => {
  // TODO: update the snapshot test below once the real page is created
  it('should match an empty page (for now)', () => {
    const renderer = ReactTestRenderer.create(<BrightMirror />);
    const result = renderer.toJSON();
    expect(result).toMatchSnapshot();
  });
});