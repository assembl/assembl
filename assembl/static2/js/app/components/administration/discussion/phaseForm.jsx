// @flow
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Radio, SplitButton, MenuItem } from 'react-bootstrap';
import { Link } from 'react-router';
import moment from 'moment';
import { modulesTranslationKeys } from '../../../constants';
import { updatePhaseIdentifier } from '../../../actions/adminActions/timeline';

type PhaseFormProps = {
  phaseId: string,
  phaseNumber: number,
  identifier: string,
  handleIdentifierChange: Function
}

type PhaseFormState = {
  selectedModule: string,
  isThematicsTable: boolean,
  startDate: moment,
  endDate: moment
}

export class DumbPhaseForm extends React.Component<PhaseFormProps, PhaseFormState> {
  constructor(props: PhaseFormProps) {
    super(props);
    this.state = {
      startDate: moment(),
      endDate: moment(),
      isThematicsTable: false,
      selectedModule: props.identifier || modulesTranslationKeys[0]
    };
  }

  componentWillReceiveProps(nextProps: PhaseFormProps) {
    this.setState({
      selectedModule: nextProps.identifier
    });
  }

  handleStartDateChange = (date: moment) => {
    this.setState({
      startDate: date
    });
  }

  handleEndDateChange = (date: moment) => {
    this.setState({
      endDate: date
    });
  }

  handleThematicsTableCheck = () => {
    this.setState({
      isThematicsTable: true
    });
  }

  handleThematicsTableUncheck = () => {
    this.setState({
      isThematicsTable: false
    });
  }

  render() {
    const { phaseId, phaseNumber, handleIdentifierChange } = this.props;
    const { startDate, endDate, isThematicsTable, selectedModule } = this.state;
    return (
      <div className="phase-form">
        <DatePicker selected={startDate} onChange={this.handleStartDateChange} showTimeSelect />
        <DatePicker selected={endDate} onChange={this.handleEndDateChange} showTimeSelect />
        <Translate value="administration.timelineAdmin.phaseModule" />
        <Radio onChange={this.handleThematicsTableCheck} checked={isThematicsTable}>
          <Translate value="administration.timelineAdmin.thematicsTable" />
        </Radio>
        <Radio onChange={this.handleThematicsTableUncheck} checked={!isThematicsTable}>
          <SplitButton
            className="admin-dropdown"
            id={`dropdown-${phaseId}`}
            title={I18n.t(`administration.modules.${selectedModule}`)}
            onSelect={handleIdentifierChange}
          >
            {modulesTranslationKeys.map(key => (
              <MenuItem key={`module-${key}`} eventKey={key}>
                {I18n.t(`administration.modules.${key}`)}
              </MenuItem>
            ))}
          </SplitButton>
        </Radio>
        <Link to="" /* TODO: add route to phase configuration page */ >
          <Translate value="administration.timelineAdmin.configurePhase" count={phaseNumber} />{' '}
        </Link>
      </div>
    );
  }
}

const mapStateToProps = (state, { phaseId }) => {
  const phase = state.admin.timeline.phasesById.get(phaseId);
  return {
    identifier: phase.get('identifier')
  };
};

const mapDispatchToProps = (dispatch, { phaseId }) => ({
  handleIdentifierChange: eventKey => dispatch(updatePhaseIdentifier(phaseId, eventKey))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbPhaseForm);