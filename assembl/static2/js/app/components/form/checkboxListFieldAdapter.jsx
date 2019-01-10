// @flow
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { Checkbox, FormGroup } from 'react-bootstrap';

import Error from './error';
import { getValidationState } from './utils';
import type { CheckboxListValue, CheckboxListOption } from './types.flow';

type Props = FieldRenderProps & {
  input: {
    name: string,
    onBlur: (?SyntheticFocusEvent<*>) => void,
    onChange: (SyntheticInputEvent<*> | any) => void,
    onFocus: (?SyntheticFocusEvent<*>) => void,
    value: ?CheckboxListValue
  }
};

function toggleIsChecked(option: CheckboxListOption): CheckboxListOption {
  return {
    ...option,
    isChecked: !option.isChecked
  };
}
export default class CheckboxListFieldAdapter extends React.Component<Props> {
  onCheckboxChange = (v: string) => {
    const { input } = this.props;
    const newValue = input.value && input.value.map(option => (option.value === v ? toggleIsChecked(option) : option));
    if (newValue) {
      input.onChange(newValue);
    }
  };

  render() {
    const { input, meta: { error, touched } } = this.props;
    return (
      <FormGroup controlId={input.name} validationState={getValidationState(error, touched)}>
        {input.value &&
          input.value.map(option => (
            <Checkbox
              key={option.value}
              checked={option.isChecked}
              onChange={() => this.onCheckboxChange(option.value)}
              title={option.label}
              value={option.value}
            >
              {option.label}
            </Checkbox>
          ))}
        <Error name={input.name} />
      </FormGroup>
    );
  }
}