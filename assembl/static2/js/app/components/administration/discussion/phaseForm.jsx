import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Translate, I18n } from 'react-redux-i18n';
import { Radio, SplitButton, MenuItem } from 'react-bootstrap';
import { Link } from 'react-router';
import moment from 'moment';
import { modulesTranslationKeys } from '../../../constants';


export class DumbPhaseForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: moment(),
      endDate: moment(),
      isThematicsTable: false,
      selectedModule: props.phaseModule
    };
  }

  handleStartDateChange = (date) => {
    this.setState({
      startDate: date
    });
  }

  handleEndDateChange = (date) => {
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
    const { phaseId, phaseNumber } = this.props;
    const { startDate, endDate, isThematicsTable, selectedModule } = this.state;
    return (
      <div className="phase-form">
        <DatePicker selected={startDate} onChange={this.handleDateChange} showTimeSelect />
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
            onSelect={(eventKey) => { this.setState({ selectedModule: eventKey }); }}
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

export default DumbPhaseForm;