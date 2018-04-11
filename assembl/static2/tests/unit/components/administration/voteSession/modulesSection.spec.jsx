import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { List, Map } from 'immutable';

import { DumbModulesSection } from '../../../../../js/app/components/administration/voteSession/modulesSection';
import '../../../../helpers/setupTranslations';

describe('ModulesSection component', () => {
  const toggleModuleCheckboxSpy = jest.fn();
  const handleGaugeSelectChangeSpy = jest.fn();
  const handleSeeCurrentVotesChangeSpy = jest.fn();

  it('should render a ModulesSection component without any TokensForm nor GaugeForm', () => {
    const props = {
      tokenModules: List(),
      gaugeModules: List(),
      editLocale: 'fr',
      toggleModuleCheckbox: toggleModuleCheckboxSpy,
      handleGaugeSelectChange: handleGaugeSelectChangeSpy,
      handleSeeCurrentVotesChange: handleSeeCurrentVotesChangeSpy,
      seeCurrentVotes: false
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbModulesSection {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should render a ModuleSection component with token and gauges', () => {
    const tokenModule = Map({
      _toDelete: true,
      _hasChanged: false,
      _isNew: false,
      id: 'my-token',
      instructionsEntries: List()
    });
    const numGaugeModule = Map({
      _toDelete: false,
      _hasChanged: false,
      _isNew: false,
      id: 'my-num-gauge',
      instructionsEntries: List(),
      max: 11,
      min: 0,
      nbTicks: 4
    });
    const textGaugeModule = Map({
      _toDelete: true,
      _hasChanged: false,
      _isNew: false,
      id: 'my-text-gauge',
      instructionsEntries: List()
    });
    const props = {
      tokenModules: List.of(tokenModule),
      gaugeModules: List.of(numGaugeModule, textGaugeModule),
      editLocale: 'en',
      toggleModuleCheckbox: toggleModuleCheckboxSpy,
      handleGaugeSelectChange: handleGaugeSelectChangeSpy,
      handleSeeCurrentVotesChange: handleSeeCurrentVotesChangeSpy,
      seeCurrentVotes: true
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbModulesSection {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});