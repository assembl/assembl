// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import FormControlWithLabel from '../../common/formControlWithLabel';

type NumberGaugeFormProps = {
  minimum: ?number,
  maximum: ?number,
  unit: ?string,
  handleMinChange: Function,
  handleMaxChange: Function,
  handleUnitChange: Function
};

const DumbNumberGaugeForm = ({
  minimum,
  maximum,
  unit,
  handleMinChange,
  handleMaxChange,
  handleUnitChange
}: NumberGaugeFormProps) => {
  const onMinChange = (value: number) => {
    if (value > 0) {
      handleMinChange(value);
    }
  };
  const onMaxChange = (value: number) => {
    if (value > 0) {
      handleMaxChange(value);
    }
  };
  return (
    <div>
      <FormGroup>
        <FormControlWithLabel
          onChange={e => onMinChange(parseInt(e.target.value, 10))}
          value={minimum ? minimum.toString() : ''}
          label={I18n.t('administration.minValue')}
          required
          type="number"
        />
        <FormControlWithLabel
          onChange={e => onMaxChange(parseInt(e.target.value, 10))}
          value={maximum ? maximum.toString() : ''}
          label={I18n.t('administration.maxValue')}
          required
          type="number"
        />
        <FormControlWithLabel
          onChange={e => handleUnitChange(e.target.value)}
          value={unit}
          label={I18n.t('administration.unit')}
          required
          type="text"
        />
      </FormGroup>
    </div>
  );
};

export default DumbNumberGaugeForm;