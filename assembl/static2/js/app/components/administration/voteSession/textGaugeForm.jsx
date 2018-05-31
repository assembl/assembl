// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
import { List, Map } from 'immutable';

import FormControlWithLabel from '../../common/formControlWithLabel';

type TextGaugeFormProps = {
  choices: List<Map<string, any>>,
  handleGaugeChoiceLabelChange: Function
};

const DumbTextGaugeForm = ({ choices, handleGaugeChoiceLabelChange }: TextGaugeFormProps) => (
  <div>
    {choices.map((choice, idx) => (
      <div key={`gauge-choice-${idx}`}>
        <FormControlWithLabel
          value={choice.get('title')}
          onChange={e => handleGaugeChoiceLabelChange(choice.get('id'), e.target.value)}
          label={`${I18n.t('administration.valueTitle')} ${idx + 1}`}
          required
          type="text"
        />
      </div>
    ))}
  </div>
);

export default DumbTextGaugeForm;