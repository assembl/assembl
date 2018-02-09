// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { updateGaugeMinimum, updateGaugeMaximum, updateGaugeUnit } from '../../../actions/adminActions/voteSession';

type NumberGaugeFormProps = {
  minimum: number,
  maximum: number,
  unit: string,
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
        value={minimum}
        label={I18n.t('administration.minValue')}
        required
        type="number"
      />
      <FormControlWithLabel
        onChange={handleMaxChange}
        value={maximum}
        label={I18n.t('administration.maxValue')}
        required
        type="number"
      />
      <FormControlWithLabel onChange={handleUnitChange} value={unit} label={I18n.t('administration.unit')} required type="text" />
    </FormGroup>
  </div>
);

const mapStateToProps = (state, { id }) => {
  const module = state.admin.voteSession.modulesById.get(id);
  return {
    minimum: module.get('minimum'),
    maximum: module.get('maximum'),
    unit: module.get('unit')
  };
};

const mapDispatchToProps = (dispatch, { id }) => ({
  handleMinChange: e => dispatch(updateGaugeMinimum(id, e.target.value)),
  handleMaxChange: e => dispatch(updateGaugeMaximum(id, e.target.value)),
  handleUnitChange: e => dispatch(updateGaugeUnit(id, e.target.value))
});

export { DumbNumberGaugeForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbNumberGaugeForm);