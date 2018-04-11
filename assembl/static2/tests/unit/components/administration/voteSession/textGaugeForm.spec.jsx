import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { List, Map } from 'immutable';

import DumbTextGaugeForm from '../../../../../js/app/components/administration/voteSession/textGaugeForm';
import '../../../../helpers/setupTranslations';

describe('DumbTextGaugeForm component', () => {
  const handleGaugeChoiceLabelChange = jest.fn();

  it('should render a form to set up a textual gauge', () => {
    const choices = List.of(
      Map({
        id: 'choice-1',
        title: 'contextually-based'
      }),
      Map({
        id: 'choice-2',
        title: 'Savings Account Knoll'
      })
    );
    const props = {
      choices: choices,
      handleGaugeChoiceLabelChange: handleGaugeChoiceLabelChange
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTextGaugeForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});