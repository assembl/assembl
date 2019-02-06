// @flow

/*
  DatePicker adapter for react-final-form that supports the following form:
  { time: moment().utc() }

  Errors are managed by a Mutator on the Form itself. As a result, to show errors
  on DatePickerFieldAdapter, must add the `setFieldTouched` from final-form-set-field-touched
  along with passing the form <FormApi> prop
*/
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as React from 'react';
import { ControlLabel, FormGroup } from 'react-bootstrap';
import { type FieldRenderProps } from 'react-final-form';
import { type FormApi } from 'final-form';
import type { DatePickerType, DatePickerValue } from './types.flow';
import Error from './error';
import { getValidationState } from './utils';

type Props = {
  editLocale: string,
  picker?: DatePickerType,
  placeHolder: string,
  showTime: boolean,
  hasConflictingDate: boolean,
  input: {
    name: string,
    onChange: ({ time: moment$Moment }) => void,
    value: DatePickerValue
  },
  onDateChange: ?(moment$Moment) => void,
  form: FormApi,
  children?: React.Node,
  dateFormat?: 'string'
} & FieldRenderProps;

const DatePickerFieldAdapter = ({
  editLocale,
  picker,
  placeHolder,
  showTime,
  input: { name, value, onChange },
  meta: { error, touched },
  required,
  hasConflictingDate,
  onDateChange,
  children,
  form,
  dateFormat,
  ...rest
}: Props) => {
  const onLocalizedChange = (e: moment$Moment): void => {
    if (e !== value.time) {
      if (form) {
        form.mutators.setFieldTouched(name, true);
      }
      if (onDateChange) {
        onDateChange(e);
      }
    }
    return onChange({ time: e });
  };

  return (
    <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
      <div className="date-picker-field">
        <ControlLabel className="datepicker-label">
          {picker &&
            picker.pickerType && <div className={`date-picker-type ${picker.pickerClasses || ''}`}>{picker.pickerType}</div>}
          <DatePicker
            placeholderText={placeHolder}
            selected={value.time}
            id={`date-picker-${name}`}
            onChange={onLocalizedChange}
            showTimeSelect={showTime}
            dateFormat={dateFormat}
            locale={editLocale}
            shouldCloseOnSelect
            className={hasConflictingDate ? 'warning' : ''}
            {...rest}
          />
          <div className="icon-schedule-container">
            <span className="assembl-icon-schedule grey" />
          </div>
        </ControlLabel>
        <Error name={name} />
        {children || null}
      </div>
    </FormGroup>
  );
};

DatePickerFieldAdapter.defaultProps = {
  showTime: false,
  dateFormat: 'LLL'
};

export default DatePickerFieldAdapter;