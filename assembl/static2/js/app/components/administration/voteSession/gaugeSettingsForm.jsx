// @flow
import React from 'react';
import { connect } from 'react-redux';
import { SplitButton, MenuItem, Radio, Checkbox } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import range from 'lodash/range';
import { List } from 'immutable';
import { Translate, I18n } from 'react-redux-i18n';
import SectionTitle from '../sectionTitle';
import NumberGaugeForm from './numberGaugeForm';
import TextGaugeForm from './textGaugeForm';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { createRandomId } from '../../../utils/globalFunctions';
import { displayAlert } from '../../../utils/utilityManager';
import {
  updateGaugeVoteInstructions,
  updateGaugeVoteNbTicks,
  updateGaugeVoteIsNumber,
  createGaugeVoteChoice,
  deleteGaugeVoteChoice
} from '../../../actions/adminActions/voteSession';
import FormControlWithLabel from '../../common/formControlWithLabel';
import SaveButton, { getMutationsPromises, runSerial } from '../../../components/administration/saveButton';
import updateGaugeVoteSpecificationMutation from '../../../graphql/mutations/updateGaugeVoteSpecification.graphql';
import updateNumberGaugeVoteSpecificationMutation from '../../../graphql/mutations/updateNumberGaugeVoteSpecification.graphql';
import createGaugeVoteSpecificationMutation from '../../../graphql/mutations/createGaugeVoteSpecification.graphql';
import createNumberGaugeVoteSpecificationMutation from '../../../graphql/mutations/createNumberGaugeVoteSpecification.graphql';

// type GaugeSettingsFormProps = {
//   gaugeModuleId: string,
//   choices: Array<Object>,
//   nbTicks: number,
//   instructions: string,
//   handleInstructionsChange: Function,
//   handleNumberGaugeCheck: Function,
//   handleNbTicksSelectChange: Function,
//   handleNumberGaugeUncheck: Function,
//   isNumberGauge: boolean
// };

// FIXME: use GaugeSettingsFormProps for type
const DumbGaugeSettingsForm = ({
  gaugeModuleId,
  choices,
  nbTicks,
  instructions,
  handleInstructionsChange,
  handleNbTicksSelectChange,
  handleNumberGaugeCheck,
  handleNumberGaugeUncheck,
  isNumberGauge,
  voteSessionPage,
  textGaugeModulesHaveChanged,
  updateGaugeVoteSpecification,
  createGaugeVoteSpecification,
  deleteVoteSpecification,
  module,
  editLocale
}: Object) => {
  const runMutations = (mutationsPromises) => {
    runSerial(mutationsPromises).then(() => {
      // refetchVoteSession() ?
      displayAlert('success', I18n.t('administration.voteSessionSuccess'));
    });
  };

  const createVariablesForTextGaugeMutation = voteModule => ({
    proposalId: voteModule.proposalId,
    voteSpecTemplateId: voteModule.voteSpecTemplateId,
    voteSessionId: voteModule.voteSessionId,
    titleEntries: [],
    instructionsEntries: voteModule.instructionsEntries,
    choices: voteModule.choices
      ? voteModule.choices.map((c, index) => ({
        labelEntries: c.labelEntries,
        value: index.toFixed(2)
      }))
      : []
  });

  const createVariablesForDeleteMutation = item => ({ id: item.id });

  const getTextGaugeSpecMutationsPromises = items =>
    getMutationsPromises({
      items: items,
      variablesCreator: createVariablesForTextGaugeMutation,
      deleteVariablesCreator: createVariablesForDeleteMutation,
      createMutation: createGaugeVoteSpecification,
      updateMutation: updateGaugeVoteSpecification,
      deleteMutation: deleteVoteSpecification,
      lang: editLocale
    });

  const saveAction = () => {
    const voteSessionPageId = voteSessionPage.get('id');
    if (voteSessionPageId) {
      if (textGaugeModulesHaveChanged) {
        const items = List([{ ...module.toJS(), voteSessionId: voteSessionPageId }]);
        const mutationsPromises = getTextGaugeSpecMutationsPromises(items);
        runMutations(mutationsPromises);
      }
    }
  };
  return (
    <div className="gauge-modal-form-container">
      <SectionTitle title={I18n.t('administration.gaugeModal.title')} annotation={I18n.t('administration.gaugeModal.subTitle')} />
      <form className="gauge-modal-form">
        <div className="flex margin-m">
          <FormControlWithLabel
            value={instructions}
            label={I18n.t('administration.gaugeVoteInstructions')}
            required
            type="text"
            onChange={handleInstructionsChange}
          />
        </div>
        <div className="flex">
          <label htmlFor={`dropdown-${gaugeModuleId}`}>
            <Translate value="administration.nbTicks" />
          </label>
        </div>
        <SplitButton
          title={nbTicks}
          id={`dropdown-${gaugeModuleId}`}
          required
          onSelect={(eventKey) => {
            handleNbTicksSelectChange(eventKey, isNumberGauge, nbTicks);
          }}
        >
          {range(nbTicks).map(value => (
            <MenuItem key={`gauge-notch-${value + 1}`} eventKey={value + 1}>
              {value + 1}
            </MenuItem>
          ))}
        </SplitButton>
        <div className="margin-m">
          <Radio onChange={handleNumberGaugeUncheck} checked={!isNumberGauge} name="gauge-type">
            <Translate value="administration.textValue" />
          </Radio>
          <Radio onChange={handleNumberGaugeCheck} checked={isNumberGauge} name="gauge-type">
            <Translate value="administration.numberValue" />
          </Radio>
        </div>
        {isNumberGauge && <NumberGaugeForm id={gaugeModuleId} />}
        {!isNumberGauge &&
          choices.map((cid, idx) => <TextGaugeForm key={`gauge-choice-${idx}`} id={cid} index={idx} editLocale={editLocale} />)}
        <Checkbox>
          <Translate value="administration.gaugeModal.checkboxLabel" />
        </Checkbox>
        <SaveButton disabled={false} saveAction={saveAction} specificClasses="save-button button-submit button-dark full-size" />
      </form>
    </div>
  );
};

const mapStateToProps = (state, { gaugeModuleId, editLocale }) => {
  const module = state.admin.voteSession.modulesById.get(gaugeModuleId);
  const instructions = getEntryValueForLocale(module.get('instructionsEntries'), editLocale);
  const { textGaugeModulesHaveChanged, numberGaugeModulesHaveChanged } = state.admin.voteSession;
  return {
    instructions: instructions,
    isNumberGauge: module.get('isNumberGauge'),
    choices: module.get('isNumberGauge') ? null : module.get('choices'),
    nbTicks: module.get('isNumberGauge') ? module.get('nbTicks') : module.get('choices').size,
    textGaugeModulesHaveChanged: textGaugeModulesHaveChanged,
    numberGaugeModulesHaveChanged: numberGaugeModulesHaveChanged,
    voteSessionPage: state.admin.voteSession.page,
    module: module
  };
};

const mapDispatchToProps = (dispatch, { gaugeModuleId, editLocale }) => ({
  handleInstructionsChange: e => dispatch(updateGaugeVoteInstructions(gaugeModuleId, editLocale, e.target.value)),
  handleNbTicksSelectChange: (value, isNumberGauge, nbTicks) => {
    if (isNumberGauge) {
      dispatch(updateGaugeVoteNbTicks(gaugeModuleId, value));
    } else if (nbTicks < value) {
      const nbChoiceToCreate = value - nbTicks;
      for (let i = 0; i < nbChoiceToCreate; i += 1) {
        const newId = createRandomId();
        dispatch(createGaugeVoteChoice(gaugeModuleId, newId));
      }
    } else {
      const nbChoiceToDelete = nbTicks - value;
      for (let i = 0; i < nbChoiceToDelete; i += 1) {
        dispatch(deleteGaugeVoteChoice(gaugeModuleId, nbTicks - 1 - i));
      }
    }
  },
  handleNumberGaugeCheck: () => dispatch(updateGaugeVoteIsNumber(gaugeModuleId, true)),
  handleNumberGaugeUncheck: () => dispatch(updateGaugeVoteIsNumber(gaugeModuleId, false))
});

export { DumbGaugeSettingsForm };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(updateGaugeVoteSpecificationMutation, { name: 'updateGaugeVoteSpecification' }),
  graphql(updateNumberGaugeVoteSpecificationMutation, { name: 'updateNumberGaugeVoteSpecification' }),
  graphql(createGaugeVoteSpecificationMutation, { name: 'createGaugeVoteSpecification' }),
  graphql(createNumberGaugeVoteSpecificationMutation, { name: 'createNumberGaugeVoteSpecification' })
)(DumbGaugeSettingsForm);