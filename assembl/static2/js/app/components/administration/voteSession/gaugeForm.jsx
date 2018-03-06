// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import range from 'lodash/range';
import { SplitButton, MenuItem, Radio } from 'react-bootstrap';
import Helper from '../../common/helper';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';
import NumberGaugeForm from './numberGaugeForm';
import TextGaugeForm from './textGaugeForm';
import {
  updateGaugeVoteInstructions,
  updateGaugeVoteNbTicks,
  updateGaugeVoteIsNumber,
  createGaugeVoteChoice,
  deleteGaugeVoteChoice
} from '../../../actions/adminActions/voteSession';

type GaugeFormProps = {
  id: string,
  index: number,
  editLocale: string,
  instructions: string,
  nbTicks: number,
  isNumberGauge: boolean,
  choices: Array<Object>,
  handleInstructionsChange: Function,
  handleNbTicksSelectChange: Function,
  handleNumberGaugeCheck: Function,
  handleNumberGaugeUncheck: Function
};

const DumbGaugeForm = ({
  id,
  editLocale,
  instructions,
  nbTicks,
  isNumberGauge,
  choices,
  handleInstructionsChange,
  handleNbTicksSelectChange,
  handleNumberGaugeCheck,
  handleNumberGaugeUncheck,
  index
}: GaugeFormProps) => (
  <div className="gauges-vote-form">
    <Translate value="administration.gauge" number={index + 1} />
    <div className="flex margin-m">
      <FormControlWithLabel
        value={instructions}
        label={I18n.t('administration.gaugeVoteInstructions')}
        required
        type="text"
        onChange={handleInstructionsChange}
      />
      <Helper
        helperUrl="/static2/img/helpers/helper6.png"
        helperText={I18n.t('administration.helpers.gaugeVoteInstructions')}
        additionalTextClasses="helper-text-only"
      />
    </div>
    <div className="flex">
      <label htmlFor={`dropdown-${id}`}>
        <Translate value="administration.nbTicks" />
      </label>
    </div>
    <SplitButton
      title={nbTicks}
      id={`dropdown-${id}`}
      required
      onSelect={(eventKey) => {
        handleNbTicksSelectChange(eventKey, isNumberGauge, nbTicks);
      }}
    >
      {range(10).map(value => (
        <MenuItem key={`gauge-notch-${value + 1}`} eventKey={value + 1}>
          {value + 1}
        </MenuItem>
      ))}
    </SplitButton>
    <div className="margin-m">
      <Radio onChange={handleNumberGaugeUncheck} checked={!isNumberGauge} name={`gauge-type-${id}`}>
        <Translate value="administration.textValue" />
      </Radio>
      <Radio onChange={handleNumberGaugeCheck} checked={isNumberGauge} name={`gauge-type-${id}`}>
        <Translate value="administration.numberValue" />
      </Radio>
    </div>
    {isNumberGauge && <NumberGaugeForm id={id} />}
    {!isNumberGauge &&
      choices.map((cid, idx) => <TextGaugeForm key={`gauge-choice-${idx}`} id={cid} index={idx} editLocale={editLocale} />)}
    <div className="separator" />
  </div>
);

const mapStateToProps = (state, { id, editLocale }) => {
  const module = state.admin.voteSession.modulesById.get(id);
  const instructions = getEntryValueForLocale(module.get('instructionsEntries'), editLocale);
  return {
    instructions: instructions,
    nbTicks: module.get('isNumberGauge') ? module.get('nbTicks') : module.get('choices').size,
    isNumberGauge: module.get('isNumberGauge'),
    choices: module.get('isNumberGauge') ? null : module.get('choices')
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale }) => ({
  handleInstructionsChange: e => dispatch(updateGaugeVoteInstructions(id, editLocale, e.target.value)),
  handleNbTicksSelectChange: (value, isNumberGauge, nbTicks) => {
    if (isNumberGauge) {
      dispatch(updateGaugeVoteNbTicks(id, value));
    } else if (nbTicks < value) {
      const nbChoiceToCreate = value - nbTicks;
      for (let i = 0; i < nbChoiceToCreate; i += 1) {
        const newId = Math.round(Math.random() * -1000000).toString();
        dispatch(createGaugeVoteChoice(id, newId));
      }
    } else {
      const nbChoiceToDelete = nbTicks - value;
      for (let i = 0; i < nbChoiceToDelete; i += 1) {
        dispatch(deleteGaugeVoteChoice(id, nbTicks - 1 - i));
      }
    }
  },
  handleNumberGaugeCheck: () => dispatch(updateGaugeVoteIsNumber(id, true)),
  handleNumberGaugeUncheck: () => dispatch(updateGaugeVoteIsNumber(id, false))
});

export { DumbGaugeForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbGaugeForm);