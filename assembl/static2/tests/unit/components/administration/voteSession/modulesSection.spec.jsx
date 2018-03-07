import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { List } from 'immutable';

import { DumbModulesSection } from '../../../../../js/app/components/administration/voteSession/modulesSection';

describe('ModulesSection component', () => {
  const handleCheckBoxChangeSpy = jest.fn(() => {});

  it('should render a ModulesSection component without any TokensForm nor GaugeForm', () => {
    const props = {
      tokenModules: List(),
      gaugeModules: List(),
      editLocale: 'fr',
      handleCheckBoxChange: handleCheckBoxChangeSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbModulesSection {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  // TODO: fake a list of token modules to test their rendering
});