// @flow

/*
  DatePicker adapter for react-final-form that supports the following form:
  { time: moment().utc() }
*/
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup, FormControl } from 'react-bootstrap';

import Error from './error';
import { getValidationState } from './utils';

const DatePickerFieldAdapter = ({
  editLocale,
  picker: { pickerType, pickerClasses },
  placeHolder,
  showTime,
  input: { name, value, onChange },
  meta: { error, touched },
  children,
  ...rest }) => (
    <div className="date-picker-field">
      {pickerType && <div className={`date-picker-type ${pickerClasses || ''}`}>{pickerType}</div>}
      <label htmlFor={`date-picker-${name}`} className="datepicker-label">
      <DatePicker
          placeholderText={placeHolder}
          selected={value.time}
          id={`date-picker-${name}`}
          onChange={e => onChange({ time: e })}
          showTimeSelect={showTime || false}
          dateFormat="LLL"
          locale={editLocale}
          shouldCloseOnSelect
          {...rest}
        />
      <div className="icon-schedule-container">
          <span className="assembl-icon-schedule grey" />
        </div>
    </label>
      {children || null}
    </div>
);

DatePickerFieldAdapter.defaultProps = {
  showTime: false,
  dateFormat: 'LLL'
};

export default DatePickerFieldAdapter;