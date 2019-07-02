// @flow
import React from 'react';
import { OnChange } from 'react-final-form-listeners';
import { Field } from 'react-final-form';

type Props = {
  field: string,
  becomes: boolean,
  set: string,
  to: boolean
};

const OnChangeFieldSetField = ({ field, becomes, set, to }: Props) => (
  <Field name={set} subscription={{}}>
    {(
      // No subscription. We only use Field to get to the change function
      { input: { onChange } }
    ) => (
      <OnChange name={field}>
        {(value) => {
          if (value === becomes) {
            onChange(to);
          }
        }}
      </OnChange>
    )}
  </Field>
);

export default OnChangeFieldSetField;