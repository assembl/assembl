// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { List, Map } from 'immutable';
import range from 'lodash/range';
import { Button, FormGroup, MenuItem, OverlayTrigger, Radio, SplitButton } from 'react-bootstrap';

import { confirmDeletionModal } from '../../form/fieldArrayWithActions';
import { deleteGaugeTooltip } from '../../common/tooltips';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { createRandomId } from '../../../utils/globalFunctions';
import FormControlWithLabel from '../../common/formControlWithLabel';
import NumberGaugeForm from './numberGaugeForm';
import TextGaugeForm from './textGaugeForm';
import {
  updateGaugeVoteInstructions,
  updateGaugeVoteNbTicks,
  updateGaugeVoteIsNumber,
  createGaugeVoteChoice,
  deleteGaugeVoteChoice,
  updateGaugeMinimum,
  updateGaugeMaximum,
  updateGaugeUnit,
  updateGaugeVoteChoiceLabel,
  markAllDependenciesAsChanged
} from '../../../actions/adminActions/voteSession';

export type VoteChoice = {|
  id: string,
  title: string
|};

type GaugeFormProps = {
  id: string,
  index: ?number,
  instructions: string,
  canChangeType: boolean,
  nbTicks: number,
  minimum: ?number,
  maximum: ?number,
  unit: ?string,
  isNumberGauge: boolean,
  choices: ?List<VoteChoice>,
  handleInstructionsChange: Function,
  createChoice: string => void,
  deleteChoice: number => void,
  updateNbTicks: number => void,
  handleDeleteGauge?: ((id: string) => void) | null,
  handleNumberGaugeCheck: Function,
  handleNumberGaugeUncheck: Function,
  handleMinChange: number => void,
  handleMaxChange: number => void,
  handleUnitChange: string => void,
  handleGaugeChoiceLabelChange: (string, string) => void
};

export const getGaugeModuleInfo = (gaugeModule: Map<string, *>, gaugeChoicesById: Map<string, *>, editLocale: string) => {
  const instructions = getEntryValueForLocale(gaugeModule.get('instructionsEntries'), editLocale);
  const choices = gaugeModule.get('choices', List());
  return {
    instructions: instructions,
    canChangeType: gaugeModule.get('_isNew'),
    nbTicks: gaugeModule.get('isNumberGauge') ? gaugeModule.get('nbTicks') : choices.size,
    isNumberGauge: gaugeModule.get('isNumberGauge'),
    choices: gaugeModule.get('isNumberGauge')
      ? null
      : choices.map((cid) => {
        const gaugeChoice = gaugeChoicesById.get(cid);
        const title = getEntryValueForLocale(gaugeChoice.get('labelEntries'), editLocale);
        const value = gaugeChoice.get('value');
        return Map({ id: cid, title: title, value: value });
      }),
    minimum: gaugeModule.get('minimum'),
    maximum: gaugeModule.get('maximum'),
    type: gaugeModule.get('type'),
    unit: gaugeModule.get('unit')
  };
};

type ChangeNbTicksParams = {
  isNumberGauge: boolean,
  nbTicks: number,
  value: number,
  createChoice: string => void,
  deleteChoice: number => void,
  updateNbTicks: number => void
};
export const changeNbTicks = ({
  createChoice,
  deleteChoice,
  isNumberGauge,
  nbTicks,
  updateNbTicks,
  value
}: ChangeNbTicksParams): void => {
  if (isNumberGauge) {
    updateNbTicks(value);
  } else if (nbTicks < value) {
    const nbChoiceToCreate = value - nbTicks;
    for (let i = 0; i < nbChoiceToCreate; i += 1) {
      const newId = createRandomId();
      createChoice(newId);
    }
  } else {
    const nbChoiceToDelete = nbTicks - value;
    for (let i = 0; i < nbChoiceToDelete; i += 1) {
      deleteChoice(nbTicks - 1 - i);
    }
  }
};

const confirmDeletionTitle = <Translate value="administration.deleteGauge" />;
const confirmDeletionBody = <Translate value="deleteConfirmation.confirmDeletionBody" />;

const DumbGaugeForm = ({
  id,
  instructions,
  nbTicks,
  canChangeType,
  isNumberGauge,
  choices,
  minimum,
  maximum,
  unit,
  handleInstructionsChange,
  createChoice,
  deleteChoice,
  updateNbTicks,
  handleDeleteGauge,
  handleNumberGaugeCheck,
  handleNumberGaugeUncheck,
  handleMinChange,
  handleMaxChange,
  handleUnitChange,
  handleGaugeChoiceLabelChange,
  index
}: GaugeFormProps) => (
  <div className="gauges-vote-form" id={`gauge-form-${index + 1}`}>
    {index !== null && <Translate value="administration.gauge" number={index + 1} />}
    {handleDeleteGauge && (
      <OverlayTrigger placement="top" overlay={deleteGaugeTooltip}>
        <Button
          onClick={() => confirmDeletionModal(confirmDeletionTitle, confirmDeletionBody, () => handleDeleteGauge(id))}
          className="admin-icons"
        >
          <span className="assembl-icon-delete grey" />
        </Button>
      </OverlayTrigger>
    )}
    <div className="flex margin-m">
      <FormControlWithLabel
        id={`gauge-vote-instructions-${index + 1}`}
        value={instructions}
        label={I18n.t('administration.gaugeVoteInstructions')}
        required
        type="text"
        onChange={handleInstructionsChange}
        helperUrl="/static2/img/helpers/helper6.png"
        helperText={I18n.t('administration.helpers.gaugeVoteInstructions')}
      />
    </div>
    <FormGroup>
      <div className="flex">
        <label htmlFor={`dropdown-${index + 1}`}>
          <Translate value="administration.nbTicks" />
        </label>
      </div>
      <SplitButton
        title={nbTicks}
        id={`dropdown-${index + 1}`}
        required
        className="admin-dropdown"
        onSelect={eventKey =>
          changeNbTicks({
            isNumberGauge: isNumberGauge,
            nbTicks: nbTicks,
            value: eventKey,
            createChoice: createChoice,
            deleteChoice: deleteChoice,
            updateNbTicks: updateNbTicks
          })
        }
      >
        {range(2, 11).map(value => (
          <MenuItem key={`gauge-notch-${value}`} eventKey={value}>
            {value}
          </MenuItem>
        ))}
      </SplitButton>
    </FormGroup>
    {canChangeType && (
      <div className="margin-m">
        <Radio
          onChange={handleNumberGaugeUncheck}
          checked={!isNumberGauge}
          name={`gauge-type-${id}`}
          id={`radio-text-${index + 1}`}
        >
          <Translate value="administration.textValue" />
        </Radio>
        <Radio
          onChange={handleNumberGaugeCheck}
          checked={isNumberGauge}
          name={`gauge-type-${id}`}
          id={`radio-number-${index + 1}`}
        >
          <Translate value="administration.numberValue" />
        </Radio>
      </div>
    )}
    {isNumberGauge && (
      <NumberGaugeForm
        id={id}
        minimum={minimum}
        maximum={maximum}
        unit={unit}
        handleMinChange={(value: number) => handleMinChange(value)}
        handleMaxChange={(value: number) => handleMaxChange(value)}
        handleUnitChange={(value: string) => handleUnitChange(value)}
      />
    )}
    {!isNumberGauge && <TextGaugeForm choices={choices} handleGaugeChoiceLabelChange={handleGaugeChoiceLabelChange} />}
    <div className="separator" />
  </div>
);

DumbGaugeForm.defaultProps = {
  handleDeleteGauge: null,
  index: null,
  minimum: 0,
  maximum: 10
};

const mapStateToProps = (state, { id, editLocale }) => {
  const { gaugeChoicesById } = state.admin.voteSession;
  const gaugeModule = state.admin.voteSession.modulesById.get(id);
  return getGaugeModuleInfo(gaugeModule, gaugeChoicesById, editLocale);
};

const mapDispatchToProps = (dispatch, { id, editLocale }) => ({
  handleInstructionsChange: (e) => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(updateGaugeVoteInstructions(id, editLocale, e.target.value));
  },
  createChoice: (newId) => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(createGaugeVoteChoice(id, newId));
  },
  deleteChoice: (idx) => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(deleteGaugeVoteChoice(id, idx));
  },
  updateNbTicks: (value) => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(updateGaugeVoteNbTicks(id, value));
  },
  handleNumberGaugeCheck: () => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(updateGaugeVoteIsNumber(id, true));
  },
  handleNumberGaugeUncheck: () => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(updateGaugeVoteIsNumber(id, false));
    dispatch(createGaugeVoteChoice(id, createRandomId()));
    dispatch(createGaugeVoteChoice(id, createRandomId()));
  },
  // for number gauge
  handleMinChange: (value) => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(updateGaugeMinimum(id, parseInt(value, 10)));
  },
  handleMaxChange: (value) => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(updateGaugeMaximum(id, parseInt(value, 10)));
  },
  handleUnitChange: (value) => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(updateGaugeUnit(id, value));
  },
  // for text gauge
  handleGaugeChoiceLabelChange: (cid, value) => {
    dispatch(markAllDependenciesAsChanged(id));
    dispatch(updateGaugeVoteChoiceLabel(cid, editLocale, value, id));
  }
});

export { DumbGaugeForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbGaugeForm);