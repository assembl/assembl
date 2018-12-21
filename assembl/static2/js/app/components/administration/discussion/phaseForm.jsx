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
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import { get } from '../../../utils/routeMap';
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
  handleStartDateChange: Function,
  handleEndDateChange: Function,
  handleIdentifierChange: Function,
  locale: string,
  hasConflictingDates: boolean,
  isNew: boolean
};

export const DumbPhaseForm = ({
  phaseId,
  phaseNumber,
  handleIdentifierChange,
  handleStartDateChange,
  handleEndDateChange,
  identifier,
  start,
  end,
  hasConflictingDates,
  locale,
  isNew
}: PhaseFormProps) => {
  const startDatePickerPlaceholder = I18n.t('administration.timelineAdmin.selectStart', { count: phaseNumber });
  const endDatePickerPlaceholder = I18n.t('administration.timelineAdmin.selectEnd', { count: phaseNumber });

  const splitButtonTitle = I18n.t(`administration.modules.${identifier}`);

  const slug = { slug: getDiscussionSlug() };

  return (
    <div className="phase-form">
      <div className="date-picker-field">
        <div className="date-picker-type">
          <Translate value="search.datefilter.from" />
        </div>
        <label htmlFor="start-datepicker" className="datepicker-label">
          <DatePicker
            placeholderText={startDatePickerPlaceholder}
            selected={start}
            id="start-datepicker"
            onChange={handleStartDateChange}
            showTimeSelect
            timeFormat="HH:mm"
            dateFormat="LLL"
            locale={locale}
            shouldCloseOnSelect
            className={hasConflictingDates ? 'warning' : ''}
          />
          <div className="icon-schedule-container">
            <span className="assembl-icon-schedule grey" />
          </div>
        </label>
        {hasConflictingDates && (
          <div className="warning-label">
            <Translate value="administration.timelineAdmin.warningLabel" />
          </div>
        )}
      </div>
      <div className="date-picker-field">
        <div className="date-picker-type">
          <Translate value="search.datefilter.to" />
        </div>
        <label htmlFor="end-datepicker" className="datepicker-label">
          <DatePicker
            placeholderText={endDatePickerPlaceholder}
            id="end-datepicker"
            selected={end}
            onChange={handleEndDateChange}
            showTimeSelect
            timeFormat="HH:mm"
            dateFormat="LLL"
            locale={locale}
            shouldCloseOnSelect
            className={hasConflictingDates ? 'warning' : ''}
          />
          <div className="icon-schedule-container">
            <span className="assembl-icon-schedule grey" />
          </div>
        </label>
        {hasConflictingDates && (
          <div className="warning-label">
            <Translate value="administration.timelineAdmin.warningLabel" />
          </div>
        )}
      </div>
      <div className="module-selection-text">
        <Translate value="administration.timelineAdmin.phaseModule" />
      </div>
      <div className="margin-m">
        <SplitButton
          className="admin-dropdown"
          disabled={!isNew}
          id={`dropdown-${phaseId}`}
          title={splitButtonTitle}
          onSelect={handleIdentifierChange}
        >
          {modulesTranslationKeys.map(key => (
            <MenuItem key={`module-${key}`} eventKey={key}>
              {I18n.t(`administration.modules.${key}`)}
            </MenuItem>
          ))}
        </SplitButton>
      </div>
      <div className="text-xs configure-module-text">
        <Translate value="administration.timelineAdmin.configureModule" />
        <Link
          to={`${get('administration', { ...slug, id: identifier }, { section: 1, phaseId: phaseId })}`}
          className="configure-module-link"
        >
          <Translate value="administration.timelineAdmin.configureModuleLink" count={phaseNumber} />
        </Link>
      </div>
    </div>
  );
};

const mapStateToProps = (state, { phaseId }) => {
  const phase = state.admin.timeline.phasesById.get(phaseId);
  return {
    identifier: phase && phase.get('identifier'),
    start: phase ? phase.get('start') : null,
    end: phase ? phase.get('end') : null,
    hasConflictingDates: phase ? phase.get('hasConflictingDates') : null,
    locale: state.i18n.locale,
    isNew: phase && phase.get('_isNew')
  };
};

const mapDispatchToProps = (dispatch, { phaseId }) => ({
  handleIdentifierChange: (eventKey) => {
    dispatch(updatePhaseIdentifier(phaseId, eventKey));
    dispatch(updateIsThematicsTable(phaseId, eventKey === 'survey'));
  },
  handleStartDateChange: date => dispatch(updateStartDate(phaseId, date)),
  handleEndDateChange: date => dispatch(updateEndDate(phaseId, date))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbPhaseForm);