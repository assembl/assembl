import React from 'react';
import { connect } from 'react-redux';
import { SplitButton, MenuItem } from 'react-bootstrap';
import range from 'lodash/range';
import Helper from '../../common/helper';
import { getEntryValueForLocale } from '../../../utils/i18n';
import GaugeForm from './gaugeForm';

const DumbGaugesForm = (props) => {
  console.log(props);
  return (
    <div className="gauges-vote-form">
      <div className="flex">
        <label htmlFor="input-dropdown-addon">Nombre de jauges</label>
        <Helper helperUrl="/static2/img/helpers/helper2.png" helperText="Définissez le nombre de jauges" />
      </div>
      <SplitButton title="Nombre de jauges" id="input-dropdown-addon" required>
        {range(11).map(value => (
          <MenuItem key={`gauge-item-${value}`} eventKey={value}>
            {value}
          </MenuItem>
        ))}
      </SplitButton>
      <div>
        <div className="separator" />
        {range(3).map((gaugeForm, index) => <GaugeForm key={`gauge-form-${gaugeForm}`} index={index} />)}
      </div>
    </div>
  );
};

// const mapStateToProps = (state, { id, editLocale }) => {
//   console.log(state);
//   const module = state.admin.voteSession.moduleById.get(id);
//   const instructions = getEntryValueForLocale(module.get('instructionsEntries'), editLocale);
//   return {
//     id: id,
//     instructions: instructions,
//     minimum: module.get('minimum'),
//     maximum: module.get('maximum'),
//     ticks: module.get('NbTicks'),
//     unit: module.get('unit')
//   };
// };

export { DumbGaugesForm };

export default DumbGaugesForm;