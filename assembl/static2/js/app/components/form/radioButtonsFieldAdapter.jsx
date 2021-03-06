// @flow
import * as React from 'react';
import { FormGroup, Radio } from 'react-bootstrap';
import { type FieldRenderProps } from 'react-final-form';

import { getValidationState } from './utils';
import Error from './error';

type Props = {
  name: string,
  input: {
    name: string,
    onBlur: (?SyntheticFocusEvent<*>) => void,
    onChange: (SyntheticInputEvent<*> | any) => void,
    onFocus: (?SyntheticFocusEvent<*>) => void,
    value: any
  }
} & FieldRenderProps;

const toggleIsChecked = option => ({
  ...option,
  isChecked: !option.isChecked
});

export default class RadioButtonsFieldAdapter extends React.Component<Props> {
  onRadioButtonChange = () => {
    const { input } = this.props;
    const newValue = input.value && input.value.map(option => toggleIsChecked(option));
    if (newValue) {
      input.onChange(newValue);
    }
  };

  render() {
    const { meta: { error, touched }, input: { name, value } } = this.props;
    return (
      <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
        {value &&
          value.map((option, index) => (
            <Radio key={`radio-${index}`} inline checked={option.isChecked} onChange={() => this.onRadioButtonChange()}>
              {option.label}
            </Radio>
          ))}
        <Error name={name} />
      </FormGroup>
    );
  }
}