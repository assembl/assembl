import React from 'react';
import { SplitButton, MenuItem, Radio, FormGroup } from 'react-bootstrap';
import range from 'lodash/range';
import Helper from '../../common/helper';
import FormControlWithLabel from '../../common/formControlWithLabel';

class DumbGaugeForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isNumberGauge: false,
      ticksNumber: 0
    };
  }

  render() {
    const { index } = this.props;
    const { isNumberGauge, ticksNumber } = this.state;
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
        <SplitButton
          title={ticksNumber}
          id={`input-dropdown-addon-${index}`}
          style={{ marginBottom: '25px' }}
          required
          onSelect={(eventKey) => {
            this.setState({ ticksNumber: eventKey });
          }}
        >
          {range(11).map(value => (
            <MenuItem key={`gauge-notch-${value}`} eventKey={value}>
              {value}
            </MenuItem>
          ))}
        </SplitButton>
        <Radio
          onChange={() => {
            this.setState({ isNumberGauge: false });
          }}
          checked={!isNumberGauge}
        >
          Valeur textuelle
        </Radio>
        <Radio
          onChange={() => {
            this.setState({ isNumberGauge: true });
          }}
          checked={isNumberGauge}
        >
          Valeur numéraire
        </Radio>
        {isNumberGauge ? (
          <FormGroup>
            <FormControlWithLabel label="Valeur minimale" required type="number" />
            <FormControlWithLabel label="Valeur maximale" required type="number" />
            <FormControlWithLabel label="Unité de mesure" required type="text" />
          </FormGroup>
        ) : (
          range(ticksNumber).map(tick => (
            <FormControlWithLabel
              label={`Intitulé de la valeur ${tick + 1}`}
              key={`Intitulé de la valeur ${tick + 1}`}
              required
              type="text"
            />
          ))
        )}

        <div className="separator" />
      </div>
    );
  }
}

export { DumbGaugeForm };

export default DumbGaugeForm;