import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { List, Map } from 'immutable';

import { DumbCustomizeGaugeForm } from '../../../../../js/app/components/administration/voteSession/customizeGaugeForm';
import '../../../../helpers/setupTranslations';

describe('DumbCustomizeGaugeForm component', () => {
  const closeSpy = jest.fn();
  const createGaugeVoteSpecificationSpy = jest.fn();
  const createNumberGaugeVoteSpecificationSpy = jest.fn();
  const updateGaugeVoteSpecificationSpy = jest.fn();
  const updateNumberGaugeVoteSpecificationSpy = jest.fn();
  const refetchVoteSessionSpy = jest.fn();

  it('should render a form to customize a gauge', () => {
    const proposalMap = Map({
      _isNew: true,
      _hasChanged: false,
      _toDelete: false,
      id: 'my-proposal',
      title: 'we need to calculate the bluetooth SQL application!',
      description: 'Earum porro dolor et laboriosam sequi laudantium ullam necessitatibus. Blanditiis harum sed.'
    });
    const props = {
      gaugeModuleId: 'my-gauge',
      editLocale: 'fr',
      choices: List(),
      instructions: 'The IB monitor is down, quantify the 1080p application so we can bypass the SMS hard drive!',
      isNumberGauge: true,
      maximum: 10,
      minimum: 1,
      nbTicks: 5,
      unit: 'k€',
      isCustom: false,
      originalModule: Map({ id: '1234' }),
      proposal: proposalMap,
      voteSessionId: 'my-vote-session',
      voteSpecTemplateId: 'my-template',
      close: closeSpy,
      createGaugeVoteSpecification: createGaugeVoteSpecificationSpy,
      createNumberGaugeVoteSpecification: createNumberGaugeVoteSpecificationSpy,
      updateGaugeVoteSpecification: updateGaugeVoteSpecificationSpy,
      updateNumberGaugeVoteSpecification: updateNumberGaugeVoteSpecificationSpy,
      refetchVoteSession: refetchVoteSessionSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbCustomizeGaugeForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});