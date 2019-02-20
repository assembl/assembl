// @flow
import React from 'react';

import FormControlWithLabel from './formControlWithLabel';

export type ConfiguredFieldType = {
  configurableField: ConfigurableField,
  id: string,
  valueData: Object
};

type Props = {
  configurableField: ConfigurableField,
  handleValueChange: Function,
  validationCallback?: (hasError: boolean) => void,
  value: any
};

const ConfiguredField = ({ configurableField, handleValueChange, validationCallback, value }: Props) => {
  if (configurableField.__typename === 'TextField' && configurableField.fieldType !== 'PASSWORD') {
    return (
      <FormControlWithLabel
        id={configurableField.id}
        label={configurableField.title}
        onChange={e => handleValueChange(e.target.value)}
        type="text"
        value={value}
        required={configurableField.required}
        disabled={configurableField.fieldType === 'EMAIL'}
        validationCallback={validationCallback}
      />
    );
  }

  if (configurableField.__typename === 'SelectField' && configurableField.options) {
    return (
      <FormControlWithLabel
        componentClass="select"
        id={configurableField.id}
        label={configurableField.title}
        onChange={e => handleValueChange(e.target.value ? [e.target.value] : null)}
        value={value ? value[0] : value}
        required={configurableField.required}
        validationCallback={validationCallback}
        labelAlwaysVisible
      >
        <option key="0" value="" />
        {configurableField.options.map(option => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </FormControlWithLabel>
    );
  }

  return null;
};

ConfiguredField.defaultProps = {
  validationCallback: () => {}
};

export default ConfiguredField;