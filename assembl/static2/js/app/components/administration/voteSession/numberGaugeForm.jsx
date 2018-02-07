// @flow
import React from 'react';
import { FormGroup } from 'react-bootstrap';
import FormControlWithLabel from '../../common/formControlWithLabel';

const DumbNumberGaugeForm = () => (
  <FormGroup>
    <FormControlWithLabel label="Valeur minimale" required type="number" />
    <FormControlWithLabel label="Valeur maximale" required type="number" />
    <FormControlWithLabel label="Unité de mesure" required type="text" />
  </FormGroup>
);

export { DumbNumberGaugeForm };

export default DumbNumberGaugeForm;