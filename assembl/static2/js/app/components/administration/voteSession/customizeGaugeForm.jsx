// @flow
import React from 'react';
import { List, Map } from 'immutable';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';

import { DumbGaugeForm, getGaugeModuleInfo, type VoteChoice } from './gaugeForm';
import { createRandomId } from '../../../utils/globalFunctions';
import {
  updateGaugeVoteInstructions,
  updateGaugeVoteNbTicks,
  updateGaugeVoteIsNumber,
  createGaugeVoteChoice,
  deleteGaugeVoteChoice
} from '../../../actions/adminActions/voteSession';
import SaveButton from '../../../components/administration/saveButton';
import updateGaugeVoteSpecificationMutation from '../../../graphql/mutations/updateGaugeVoteSpecification.graphql';
import updateNumberGaugeVoteSpecificationMutation from '../../../graphql/mutations/updateNumberGaugeVoteSpecification.graphql';
import createGaugeVoteSpecificationMutation from '../../../graphql/mutations/createGaugeVoteSpecification.graphql';
import createNumberGaugeVoteSpecificationMutation from '../../../graphql/mutations/createNumberGaugeVoteSpecification.graphql';

type Props = {
  gaugeModuleId: string,
  editLocale: string,
  choices: List<VoteChoice>,
  instructions: string,
  isNumberGauge: boolean,
  maximum: number,
  minimum: number,
  nbTicks: number,
  unit: string
};

type State = {
  applyToAllProposals: boolean,
  gaugeParams: {
    choices: List<VoteChoice>,
    instructions: string,
    isNumberGauge: boolean,
    maximum: number,
    minimum: number,
    nbTicks: number,
    unit: string
  }
};

class DumbCustomizeGaugeForm extends React.Component<void, Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      applyToAllProposals: false,
      gaugeParams: {
        choices: props.choices,
        instructions: props.instructions,
        isNumberGauge: props.isNumberGauge,
        maximum: props.maximum,
        minimum: props.minimum,
        nbTicks: props.nbTicks,
        unit: props.unit
      }
    };
  }

  handleSave = () => {
    // TODO:
    // if apply to all proposals is checked, apply changes to template, then save
    // else, apply to module, with isCustom = true, then save
  };

  toggleApplyToAllProposals = () => {
    this.setState({
      applyToAllProposals: !this.state.applyToAllProposals
    });
  };

  updateInstructions = (value: string): void => {
    this.setState(prevState => ({
      gaugeParams: {
        ...prevState.gaugeParams,
        instructions: value
      }
    }));
  };

  createChoice = (newId: string): void => {
    this.setState(prevState => ({
      gaugeParams: {
        ...prevState.gaugeParams,
        choices: prevState.gaugeParams.choices.push(Map({ id: newId, title: '' }))
      }
    }));
  };

  deleteChoice = (idx: number): void => {
    this.setState(prevState => ({
      gaugeParams: {
        ...prevState.gaugeParams,
        choices: prevState.gaugeParams.choices.delete(idx)
      }
    }));
  };

  updateNbTicks = (value: number): void => {
    this.setState(prevState => ({
      gaugeParams: {
        ...prevState.gaugeParams,
        nbTicks: value
      }
    }));
  };

  updateIsNumberGauge = (value: boolean): void =>
    this.setState(prevState => ({ gaugeParams: { ...prevState.gaugeParams, isNumberGauge: value } }));

  handleMinChange = (value: number): void =>
    this.setState(prevState => ({
      gaugeParams: {
        ...prevState.gaugeParams,
        minimum: value
      }
    }));

  handleMaxChange = (value: number): void =>
    this.setState(prevState => ({
      gaugeParams: {
        ...prevState.gaugeParams,
        maximum: value
      }
    }));

  handleUnitChange = (value: string): void =>
    this.setState(prevState => ({
      gaugeParams: {
        ...prevState.gaugeParams,
        unit: value
      }
    }));

  handleGaugeChoiceLabelChange = (choiceId: string, value: string): void => {
    this.setState((prevState) => {
      const idxToUpdate = prevState.gaugeParams.choices.findIndex(choice => choice.get('id') === choiceId);

      return {
        gaugeParams: {
          ...prevState.gaugeParams,
          choices: prevState.gaugeParams.choices.update(idxToUpdate, choice => choice.set('title', value))
        }
      };
    });
  };

  getNbTicks = (): number =>
    (this.state.gaugeParams.isNumberGauge ? this.state.gaugeParams.nbTicks : this.state.gaugeParams.choices.size);

  render() {
    const { gaugeModuleId, editLocale } = this.props;
    return (
      <div className="gauge-modal-form-container">
        <DumbGaugeForm
          editLocale={editLocale}
          id={gaugeModuleId}
          {...this.state.gaugeParams}
          canChangeType={false}
          nbTicks={this.getNbTicks()}
          createChoice={this.createChoice}
          deleteChoice={this.deleteChoice}
          updateNbTicks={this.updateNbTicks}
          handleInstructionsChange={e => this.updateInstructions(e.target.value)}
          handleNumberGaugeCheck={() => this.updateIsNumberGauge(true)}
          handleNumberGaugeUncheck={() => this.updateIsNumberGauge(false)}
          handleMinChange={this.handleMinChange}
          handleMaxChange={this.handleMaxChange}
          handleUnitChange={this.handleUnitChange}
          handleGaugeChoiceLabelChange={this.handleGaugeChoiceLabelChange}
        />
        <Checkbox onClick={this.toggleApplyToAllProposals}>
          <Translate value="administration.gaugeModal.applyToAllProposalsCheckboxLabel" />
        </Checkbox>
        <SaveButton
          disabled={false}
          saveAction={this.handleSave}
          specificClasses="save-button button-submit button-dark full-size"
        />
      </div>
    );
  }
}

const mapStateToProps = (state, { gaugeModuleId, editLocale }) => {
  const { gaugeChoicesById, modulesById } = state.admin.voteSession;
  const pModule = modulesById.get(gaugeModuleId);
  const moduleTemplate = modulesById.get(pModule.get('voteSpecTemplateId'));
  return getGaugeModuleInfo(moduleTemplate.merge(pModule), gaugeChoicesById, editLocale);
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

export { DumbCustomizeGaugeForm };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(updateGaugeVoteSpecificationMutation, { name: 'updateGaugeVoteSpecification' }),
  graphql(updateNumberGaugeVoteSpecificationMutation, { name: 'updateNumberGaugeVoteSpecification' }),
  graphql(createGaugeVoteSpecificationMutation, { name: 'createGaugeVoteSpecification' }),
  graphql(createNumberGaugeVoteSpecificationMutation, { name: 'createNumberGaugeVoteSpecification' })
)(DumbCustomizeGaugeForm);