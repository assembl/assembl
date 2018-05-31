// @flow
import * as React from 'react';
import { List, Map } from 'immutable';
import { connect } from 'react-redux';
import { Button, Checkbox } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import { DumbGaugeForm, getGaugeModuleInfo, type VoteChoice } from './gaugeForm';
import { createRandomId } from '../../../utils/globalFunctions';
import { cancelAllDependenciesCustomization, updateVoteModule } from '../../../actions/adminActions/voteSession';

type Props = {
  choices: List<VoteChoice>,
  close: Function,
  cancelAllCustomizations: Function,
  updateModule: Function,
  editLocale: string,
  gaugeModuleId: string,
  instructions: string,
  isCustom: boolean,
  isNumberGauge: boolean,
  maximum: ?number,
  minimum: ?number,
  nbTicks: number,
  type: string,
  unit: ?string,
  voteSpecTemplateId: string
};

type State = {
  _hasChanged: boolean,
  applyToAllProposals: boolean,
  gaugeParams: {
    choices: List<Map<string, string>>,
    instructions: string,
    isNumberGauge: boolean,
    maximum: ?number,
    minimum: ?number,
    nbTicks: number,
    unit: ?string
  },
  saving: boolean
};

export class DumbCustomizeGaugeForm extends React.Component<Props, State> {
  static defaultProps = {
    choices: List()
  };

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
        type: props.type,
        unit: props.unit
      },
      saving: false
    };
  }

  handleSubmit = () => {
    const { cancelAllCustomizations, close, gaugeModuleId, updateModule } = this.props;
    const { gaugeParams } = this.state;
    this.setState({ saving: true });
    if (this.state.applyToAllProposals) {
      const { voteSpecTemplateId } = this.props;
      const params = {
        ...gaugeParams,
        isCustom: false,
        // set random ids to create new choices
        choices: gaugeParams.choices && gaugeParams.choices.map(c => c.set('id', createRandomId()))
      };
      // ensure that the template is updated before to cancel the customizations
      Promise.resolve(updateModule(voteSpecTemplateId, params)).then(() => cancelAllCustomizations(voteSpecTemplateId));
    } else {
      updateModule(gaugeModuleId, { ...gaugeParams, isCustom: true });
    }
    this.setState({ saving: false });
    close();
  };

  toggleApplyToAllProposals = () => {
    this.setState({
      applyToAllProposals: !this.state.applyToAllProposals,
      _hasChanged: true
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
          <Checkbox onClick={this.toggleApplyToAllProposals} checked={this.state.applyToAllProposals}>
            <Translate value="administration.gaugeModal.applyToAllProposalsCheckboxLabel" />
          </Checkbox>
          <Button
            className="button-submit button-dark full-size"
            disabled={!this.state._hasChanged || this.state.saving}
            onClick={this.handleSubmit}
          >
            <Translate value="administration.voteProposals.edit" />
          </Button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, { gaugeModuleId, editLocale }) => {
  const { gaugeChoicesById, modulesById } = state.admin.voteSession;
  const pModule = modulesById.get(gaugeModuleId);
  const moduleTemplate = modulesById.get(pModule.get('voteSpecTemplateId'));
  let moduleInfo = getGaugeModuleInfo(moduleTemplate.merge(pModule), gaugeChoicesById, editLocale);
  // replace ids for choices that come from template to be sure to recreate them
  moduleInfo = {
    ...moduleInfo,
    voteSpecTemplateId: pModule.get('voteSpecTemplateId'),
    choices:
      moduleInfo.choices &&
      moduleInfo.choices.map((c) => {
        if (moduleTemplate.has('choices') && moduleTemplate.get('choices').includes(c.get('id'))) {
          return c.set('id', createRandomId());
        }

        return c;
      })
  };

  return {
    ...moduleInfo,
    isCustom: pModule.get('isCustom')
  };
};

const mapDispatchToProps = (dispatch, { editLocale }) => ({
  cancelAllCustomizations: id => dispatch(cancelAllDependenciesCustomization(id)),
  updateModule: (id, params) => dispatch(updateVoteModule(id, editLocale, params))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbCustomizeGaugeForm);