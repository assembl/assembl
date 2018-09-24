import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import MenuTable from '../../../../../js/app/components/debate/navigation/menuTable';

describe('MenuTable component', () => {
  it('should match the survey table', () => {
    const props = {
      identifier: 'survey',
      phaseId: 'RGlzY3Vzc2lvblBoYXNlOjI='
    };
    const renderer = new ShallowRenderer();
    renderer.render(<MenuTable {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should match the default table (ideas table)', () => {
    const props = {
      identifier: 'foo',
      phaseId: 'RGlzY3Vzc2lvblBoYXNlOjI='
    };
    const renderer = new ShallowRenderer();
    renderer.render(<MenuTable {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});