import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import TaxonomyOverflowMenu from '../../../../js/app/components/harvesting/taxonomyOverflowMenu';

describe('taxonomyOverflowMenu component', () => {
  it('should match harvestingMenu snapshot', () => {
    const props = {
      extractNature: 'issue',
      extractAction: 'classify'
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<TaxonomyOverflowMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});