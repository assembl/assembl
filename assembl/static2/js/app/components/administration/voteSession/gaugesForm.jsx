import React from 'react';
import { SplitButton, MenuItem } from 'react-bootstrap';
import range from 'lodash/range';
import Helper from '../../common/helper';
import FormControlWithLabel from '../../common/formControlWithLabel';

const DumbGaugeForm = () => (
  <div className="gauge-vote-from">
    <form>
      <div className="flex">
        <FormControlWithLabel label="instructions" required type="text" onChange={() => {}} value="Instructions" />
        <Helper
          helperUrl="/static2/img/helpers/helper5.png"
          helperText="Entrez les instructions pour le vote par jauge"
          additionalTextClasses="helper-text-only"
        />
      </div>
      <SplitButton title="Nombre de jauges" onSelect={() => {}} id="input-dropdown-addon" required>
        {range(11).map(value => (
          <MenuItem key={`gauge-item-${value}`} eventKey={value}>
            {value}
          </MenuItem>
        ))}
      </SplitButton>
    </form>
  </div>
);

export { DumbGaugeForm };

export default DumbGaugeForm;