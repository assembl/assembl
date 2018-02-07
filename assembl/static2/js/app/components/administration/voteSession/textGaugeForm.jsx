// @flow
import React from 'react';
import { connect } from 'react-redux';
import range from 'lodash/range';
import FormControlWithLabel from '../../common/formControlWithLabel';

type TextGaugeFormProps = {
  ticksNumber: number
};

const DumbTextGaugeForm = ({ ticksNumber }: TextGaugeFormProps) => (
  <div>
    {range(ticksNumber).map(tick => (
      <FormControlWithLabel
        label={`Intitulé de la valeur ${tick + 1}`}
        key={`Intitulé de la valeur ${tick + 1}`}
        required
        type="text"
      />
    ))}
  </div>
);

const mapStateToProps = () => ({
  ticksNumber: 3
});

export { DumbTextGaugeForm };

export default connect(mapStateToProps)(DumbTextGaugeForm);