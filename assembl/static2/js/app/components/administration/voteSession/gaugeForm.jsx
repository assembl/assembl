import React from 'react';
import { SplitButton, MenuItem, Radio, FormGroup } from 'react-bootstrap';
import range from 'lodash/range';
import Helper from '../../common/helper';
import FormControlWithLabel from '../../common/formControlWithLabel';

class DumbGaugeForm extends React.Component {
  render() {
    const { index } = this.props;
    return (
      <div className="gauge-vote-form">
        <div className="flex">
          <FormControlWithLabel label="Consigne de la jauge" required type="text" />
          <Helper
            helperUrl="/static2/img/helpers/helper5.png"
            helperText="Entrez les instructions pour le vote par jauge"
            additionalTextClasses="helper-text-only"
          />
        </div>
        <div className="flex">
          <label htmlFor={`input-dropdown-addon-${index}`}>Nombre de crans</label>
          <Helper helperUrl="/static2/img/helpers/helper2.png" helperText="Définissez le nombre de crans pour la jauge" />
        </div>
        <SplitButton title="Nombre de crans" id={`input-dropdown-addon-${index}`} style={{ marginBottom: '25px' }} required>
          {range(11).map(value => (
            <MenuItem key={`gauge-notch-${value}`} eventKey={value}>
              {value}
            </MenuItem>
          ))}
        </SplitButton>
        <FormGroup>
          <Radio name="radioGroup">Valeur textuelle</Radio>
          <Radio name="radioGroup">Valeur numéraire</Radio>
        </FormGroup>
        <FormControlWithLabel label="Valeur minimale" required type="number" />
        <FormControlWithLabel label="Valeur maximale" required type="number" />
        <FormControlWithLabel label="Unité de mesure" required type="text" />
        <div className="separator" />
      </div>
    );
  }
}

export { DumbGaugeForm };

export default DumbGaugeForm;