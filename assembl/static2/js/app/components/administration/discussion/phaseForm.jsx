// @flow
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { SplitButton, MenuItem } from 'react-bootstrap';
import { Link } from 'react-router';
import { type moment } from 'moment';
import { modulesTranslationKeys } from '../../../constants';
import { displayAlert } from '../../../utils/utilityManager';

import {
  updatePhaseIdentifier,
  updateStartDate,
  updateEndDate
} from '../../../actions/adminActions/timeline';

type PhaseFormProps = {
  phaseId: string,
  phaseNumber: number,
  identifier: string,
  start: moment,
  end: moment,
  handleStartDateChange: Function,
  handleEndDateChange: Function,
  handleIdentifierChange: Function
}

export const DumbPhaseForm = ({
  phaseId,
  phaseNumber,
  handleIdentifierChange,
  handleStartDateChange,
  handleEndDateChange,
  identifier,
  start,
  end
}: PhaseFormProps) => {
  const onStartDateChange = (newStartDate) => {
    if (newStartDate.isAfter(end)) {
      displayAlert('danger', I18n.t('administration.timelineAdmin.startIsAfterEnd'));
    } else {
      handleStartDateChange(newStartDate);
    }
  };
  const onEndDateChange = (newEndDate) => {
    if (!newEndDate.isAfter(start)) {
      displayAlert('danger', I18n.t('administration.timelineAdmin.endIsBeforeStart'));
    } else {
      handleEndDateChange(newEndDate);
    }
  };
  return (
    <div className="phase-form">
      <DatePicker selected={start} onChange={onStartDateChange} showTimeSelect timeFormat="HH:mm" />
      <DatePicker selected={end} onChange={onEndDateChange} showTimeSelect timeFormat="HH:mm" />
      <Translate value="administration.timelineAdmin.phaseModule" />
      <div className="margin-m">
        <SplitButton
          className="admin-dropdown"
          id={`dropdown-${phaseId}`}
          title={I18n.t(`administration.modules.${identifier || modulesTranslationKeys[0]}`)}
          onSelect={handleIdentifierChange}
        >
          {modulesTranslationKeys.map(key => (
            <MenuItem key={`module-${key}`} eventKey={key}>
              {I18n.t(`administration.modules.${key}`)}
            </MenuItem>
          ))}
        </SplitButton>
      </div>
      <Link to="" /* TODO: add route to phase configuration page */ >
        <Translate value="administration.timelineAdmin.configurePhase" count={phaseNumber} />{' '}
      </Link>
    </div>
  );
};


const mapStateToProps = (state, { phaseId }) => {
  const phase = state.admin.timeline.phasesById.get(phaseId);
  return {
    identifier: phase.get('identifier'),
    start: phase.get('start'),
    end: phase.get('end')
  };
};

const mapDispatchToProps = (dispatch, { phaseId }) => ({

  handleIdentifierChange: eventKey => dispatch(updatePhaseIdentifier(phaseId, eventKey)),
  handleStartDateChange: date => dispatch(updateStartDate(phaseId, date)),
  handleEndDateChange: date => dispatch(updateEndDate(phaseId, date))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbPhaseForm);