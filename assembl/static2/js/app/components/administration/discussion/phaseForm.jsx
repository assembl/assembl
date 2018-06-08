// @flow
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Radio, SplitButton, MenuItem } from 'react-bootstrap';
import { Link } from 'react-router';
import { type moment } from 'moment';
import { modulesTranslationKeys } from '../../../constants';
import {
  updatePhaseIdentifier,
  updateStartDate,
  updateEndDate,
  updateIsThematicsTable
} from '../../../actions/adminActions/timeline';

type PhaseFormProps = {
  phaseId: string,
  phaseNumber: number,
  identifier: string,
  start: moment,
  end: moment,
  isThematicsTable: boolean,
  handleIdentifierChange: Function,
  handleThematicsTableCheck: Function,
  handleThematicsTableUncheck: Function,
  handleStartDateChange: Function,
  handleEndDateChange: Function
}

export const DumbPhaseForm = ({
  phaseId,
  phaseNumber,
  handleIdentifierChange,
  handleStartDateChange,
  handleEndDateChange,
  identifier,
  start,
  end,
  isThematicsTable,
  handleThematicsTableCheck,
  handleThematicsTableUncheck
}: PhaseFormProps) => (
  <div className="phase-form">
    <DatePicker selected={start} onChange={handleStartDateChange} showTimeSelect />
    <DatePicker selected={end} onChange={handleEndDateChange} showTimeSelect />
    <Translate value="administration.timelineAdmin.phaseModule" />
    <div className="margin-m">
      <Radio onChange={handleThematicsTableCheck} checked={isThematicsTable}>
        <Translate value="administration.timelineAdmin.thematicsTable" />
      </Radio>
      <Radio onChange={handleThematicsTableUncheck} checked={!isThematicsTable}>
        <SplitButton
          className="admin-dropdown"
          id={`dropdown-${phaseId}`}
          title={I18n.t(`administration.modules.${identifier}`)}
          onSelect={handleIdentifierChange}
        >
          {modulesTranslationKeys.map(key => (
            <MenuItem key={`module-${key}`} eventKey={key}>
              {I18n.t(`administration.modules.${key}`)}
            </MenuItem>
          ))}
        </SplitButton>
      </Radio>
    </div>
    <Link to="" /* TODO: add route to phase configuration page */ >
      <Translate value="administration.timelineAdmin.configurePhase" count={phaseNumber} />{' '}
    </Link>
  </div>
);


const mapStateToProps = (state, { phaseId }) => {
  const phase = state.admin.timeline.phasesById.get(phaseId);
  return {
    identifier: phase.get('identifier'),
    start: phase.get('start'),
    end: phase.get('end'),
    isThematicsTable: phase.get('isThematicsTable')
  };
};

const mapDispatchToProps = (dispatch, { phaseId }) => ({
  handleIdentifierChange: eventKey => dispatch(updatePhaseIdentifier(phaseId, eventKey)),
  handleStartDateChange: date => dispatch(updateStartDate(phaseId, date)),
  handleEndDateChange: date => dispatch(updateEndDate(phaseId, date)),
  handleThematicsTableCheck: () => dispatch(updateIsThematicsTable(phaseId, true)),
  handleThematicsTableUncheck: () => dispatch(updateIsThematicsTable(phaseId, false))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbPhaseForm);