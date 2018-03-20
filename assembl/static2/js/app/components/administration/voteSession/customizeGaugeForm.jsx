// @flow
import React from 'react';
import { List, Map } from 'immutable';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { I18n, Translate } from 'react-redux-i18n';

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
import { createVariablesForTextGaugeMutation, createVariablesForNumberGaugeMutation } from '../../../pages/voteSessionAdmin';
import { displayAlert } from '../../../utils/utilityManager';
import { convertToLangstringEntries } from '../../../utils/i18n';

import createProposalMutation from '../../../graphql/mutations/createProposal.graphql';
import createGaugeVoteSpecificationMutation from '../../../graphql/mutations/createGaugeVoteSpecification.graphql';
import createNumberGaugeVoteSpecificationMutation from '../../../graphql/mutations/createNumberGaugeVoteSpecification.graphql';
import updateGaugeVoteSpecificationMutation from '../../../graphql/mutations/updateGaugeVoteSpecification.graphql';
import updateNumberGaugeVoteSpecificationMutation from '../../../graphql/mutations/updateNumberGaugeVoteSpecification.graphql';
import deleteVoteSpecificationMutation from '../../../graphql/mutations/deleteVoteSpecification.graphql';

type Props = {
  close: Function,
  gaugeModuleId: string,
  editLocale: string,
  choices: List<VoteChoice>,
  instructions: string,
  isNumberGauge: boolean,
  maximum: number,
  minimum: number,
  nbTicks: number,
  unit: string,
  isCustom: boolean,
  originalModule: Map<string, any>,
  proposalId: string,
  voteSessionId: string,
  voteSpecTemplateId: string,
  createGaugeVoteSpecification: Function,
  createNumberGaugeVoteSpecification: Function,
  updateGaugeVoteSpecification: Function,
  updateNumberGaugeVoteSpecification: Function,
  refetchVoteSession: Function
};

type State = {
  _hasChanged: boolean,
  applyToAllProposals: boolean,
  gaugeParams: {
    choices: List<VoteChoice>,
    instructions: string,
    isNumberGauge: boolean,
    maximum: number,
    minimum: number,
    nbTicks: number,
    unit: string
  },
  saving: boolean
};

export class DumbCustomizeGaugeForm extends React.Component<void, Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      _hasChanged: false,
      applyToAllProposals: false,
      gaugeParams: {
        choices: props.choices,
        instructions: props.instructions,
        isNumberGauge: props.isNumberGauge,
        maximum: props.maximum,
        minimum: props.minimum,
        nbTicks: props.nbTicks,
        unit: props.unit
      },
      saving: false
    };
  }

  handleSave = () => {
    const {
      close,
      createGaugeVoteSpecification,
      createNumberGaugeVoteSpecification,
      updateGaugeVoteSpecification,
      updateNumberGaugeVoteSpecification,
      editLocale,
      originalModule,
      proposalId,
      refetchVoteSession,
      voteSessionId,
      voteSpecTemplateId
    } = this.props;
    const { gaugeParams } = this.state;
    this.setState({ saving: true });

    const gaugeModule = {
      ...gaugeParams, // don't move this line to avoid to override choices
      instructionsEntries: convertToLangstringEntries(gaugeParams.instructions, editLocale),
      isCustom: true,
      proposalId: proposalId,
      titleEntries: [],
      voteSessionId: voteSessionId,
      voteSpecTemplateId: voteSpecTemplateId
    };

    let promise;
    if (gaugeParams.isNumberGauge) {
      const variables = createVariablesForNumberGaugeMutation(gaugeModule);
      if (originalModule.get('_isNew')) {
        promise = createNumberGaugeVoteSpecification({ variables: variables });
      } else if (this.state._hasChanged) {
        promise = updateNumberGaugeVoteSpecification({ variables: { ...variables, id: originalModule.get('id') } });
      }
    } else {
      const choices = gaugeParams.choices
        .map(c => ({
          id: c.get('id'),
          labelEntries: convertToLangstringEntries(c.get('title'), editLocale)
        }))
        .toArray();
      gaugeModule.choices = choices;

      const variables = createVariablesForTextGaugeMutation(gaugeModule);
      if (originalModule.get('_isNew')) {
        promise = createGaugeVoteSpecification({ variables: variables });
      } else if (this.state._hasChanged) {
        promise = updateGaugeVoteSpecification({ variables: { ...variables, id: originalModule.get('id') } });
      }
    }

    if (promise) {
      promise
        .then(() => {
          refetchVoteSession();
          displayAlert('success', I18n.t('administration.voteSessionSuccess'));
        })
        .catch(() => {
          displayAlert('danger', I18n.t('administration.anErrorOccured'));
        });
    }

    close();
  };

  toggleApplyToAllProposals = () => {
    this.setState({
      applyToAllProposals: !this.state.applyToAllProposals
    });
  };

  updateInstructions = (value: string): void => {
    this.setState(prevState => ({
      _hasChanged: true,
      gaugeParams: {
        ...prevState.gaugeParams,
        instructions: value
      }
    }));
  };

  createChoice = (newId: string): void => {
    this.setState(prevState => ({
      _hasChanged: true,
      gaugeParams: {
        ...prevState.gaugeParams,
        choices: prevState.gaugeParams.choices.push(Map({ id: newId, title: '' }))
      }
    }));
  };

  deleteChoice = (idx: number): void => {
    this.setState(prevState => ({
      _hasChanged: true,
      gaugeParams: {
        ...prevState.gaugeParams,
        choices: prevState.gaugeParams.choices.delete(idx)
      }
    }));
  };

  updateNbTicks = (value: number): void => {
    this.setState(prevState => ({
      _hasChanged: true,
      gaugeParams: {
        ...prevState.gaugeParams,
        nbTicks: value
      }
    }));
  };

  updateIsNumberGauge = (value: boolean): void =>
    this.setState(prevState => ({ _hasChanged: true, gaugeParams: { ...prevState.gaugeParams, isNumberGauge: value } }));

  handleMinChange = (value: number): void =>
    this.setState(prevState => ({
      _hasChanged: true,
      gaugeParams: {
        ...prevState.gaugeParams,
        minimum: value
      }
    }));

  handleMaxChange = (value: number): void =>
    this.setState(prevState => ({
      _hasChanged: true,
      gaugeParams: {
        ...prevState.gaugeParams,
        maximum: value
      }
    }));

  handleUnitChange = (value: string): void =>
    this.setState(prevState => ({
      _hasChanged: true,
      gaugeParams: {
        ...prevState.gaugeParams,
        unit: value
      }
    }));

  handleGaugeChoiceLabelChange = (choiceId: string, value: string): void => {
    this.setState((prevState) => {
      const idxToUpdate = prevState.gaugeParams.choices.findIndex(choice => choice.get('id') === choiceId);

      return {
        _hasChanged: true,
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
    const { gaugeModuleId } = this.props;
    return (
      <div className="gauge-modal">
        <h3 className="dark-title-3 center">
          <Translate value="administration.gaugeModal.title" />
        </h3>
        <div className="ellipsis-content">
          <Translate value="administration.gaugeModal.subTitle" />
        </div>

        <div className="form">
          <DumbGaugeForm
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
          {/* <Checkbox onClick={this.toggleApplyToAllProposals}>
            <Translate value="administration.gaugeModal.applyToAllProposalsCheckboxLabel" />
          </Checkbox> */}
          <SaveButton
            disabled={!this.state._hasChanged || this.state.saving}
            saveAction={this.handleSave}
            specificClasses="save-button button-submit button-dark full-size"
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, { gaugeModuleId, editLocale }) => {
  const { gaugeChoicesById, modulesById, page } = state.admin.voteSession;
  const pModule = modulesById.get(gaugeModuleId);
  const moduleTemplate = modulesById.get(pModule.get('voteSpecTemplateId'));
  return {
    ...getGaugeModuleInfo(moduleTemplate.merge(pModule), gaugeChoicesById, editLocale),
    isCustom: pModule.get('isCustom'),
    proposalId: pModule.get('proposalId'),
    voteSessionId: page.get('id'),
    voteSpecTemplateId: pModule.get('voteSpecTemplateId'),
    originalModule: pModule
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

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(createGaugeVoteSpecificationMutation, { name: 'createGaugeVoteSpecification' }),
  graphql(createNumberGaugeVoteSpecificationMutation, { name: 'createNumberGaugeVoteSpecification' }),
  graphql(createProposalMutation, { name: 'createProposal' }),
  graphql(updateGaugeVoteSpecificationMutation, { name: 'updateGaugeVoteSpecification' }),
  graphql(updateNumberGaugeVoteSpecificationMutation, { name: 'updateNumberGaugeVoteSpecification' }),
  graphql(deleteVoteSpecificationMutation, { name: 'deleteVoteSpecification' })
)(DumbCustomizeGaugeForm);