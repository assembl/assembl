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
}: NumberGaugeFormProps) => (
  <div>
    <FormGroup>
      <FormControlWithLabel
        onChange={handleMinChange}
        value={minimum ? minimum.toString() : ''}
        label={I18n.t('administration.minValue')}
        required
        type="number"
      />
      <FormControlWithLabel
        onChange={handleMaxChange}
        value={maximum ? maximum.toString() : ''}
        label={I18n.t('administration.maxValue')}
        required
        type="number"
      />
      <FormControlWithLabel onChange={handleUnitChange} value={unit} label={I18n.t('administration.unit')} required type="text" />
    </FormGroup>
  </div>
);

export default DumbNumberGaugeForm;