import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTextGaugeForm } from '../../../../../js/app/components/administration/voteSession/textGaugeForm';

describe('ModulesSection component', () => {
  const handleGaugeChoiceLabelChange = jest.fn(() => {});

  it('should render a form to set up a textual gauge', () => {
    const props = {
      index: 1,
      handleGaugeChoiceLabelChange: handleGaugeChoiceLabelChange,
      title: ''
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTextGaugeForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});