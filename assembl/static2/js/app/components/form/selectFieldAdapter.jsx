// @flow
import * as React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import classNames from 'classnames';
import Creatable from 'react-select/lib/Creatable';
import Select from 'react-select';
import AsyncCreatableSelect from 'react-select/lib/AsyncCreatable';
import AsyncSelect from 'react-select/lib/Async';
import makeAnimated from 'react-select/lib/animated';

import Error from './error';
import { getValidationState } from './utils';

export type Option = {
  value: string,
  label: string
};

type Props = {
  isMulti: boolean,
  isAsync: boolean,
  canCreate: boolean,
  required: boolean,
  label: string,
  classNamePrefix: string,
  placeholder: string,
  className?: string,
  noOptionsMessage: () => React.Node,
  formatCreateLabel: string => React.Node,
  options?: Array<Option>,
  loadOptions?: (string, (Array<Option>) => void) => Promise<*> | undefined,
  input: {
    name: string,
    onChange: (SyntheticInputEvent<*> | any) => void,
    value?: Array<Option> | Option
  }
} & FieldRenderProps;

const SelectFieldAdapter = ({
  isMulti,
  isAsync,
  canCreate,
  required,
  label,
  placeholder,
  className,
  options,
  loadOptions,
  input: { name, onChange, value, ...otherListeners },
  meta: { error, touched },
  ...rest
}: Props) => {
  const decoratedLabel = label && required ? `${label} *` : label;
  let SelectComponent = null;
  if (isAsync) {
    SelectComponent = canCreate ? AsyncCreatableSelect : AsyncSelect;
  } else {
    SelectComponent = canCreate ? Creatable : Select;
  }
  return (
    <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
      {decoratedLabel ? <ControlLabel>{decoratedLabel}</ControlLabel> : null}
      <SelectComponent
        className={classNames('select-field', className)}
        {...otherListeners}
        {...rest}
        cacheOptions
        defaultOptions
        isMulti={isMulti}
        components={makeAnimated()}
        name={name}
        placeholder={I18n.t(placeholder)}
        defaultValue={value}
        options={options}
        loadOptions={loadOptions}
        onChange={onChange}
      />
      <Error name={name} />
    </FormGroup>
  );
};

SelectFieldAdapter.defaultProps = {
  required: false,
  isMulti: false,
  isAsync: false,
  canCreate: false,
  options: [],
  className: '',
  classNamePrefix: 'select-field',
  placeholder: 'form.select.placeholder',
  noOptionsMessage: () => <Translate value="form.select.noOptions" />,
  formatCreateLabel: newOption => <Translate value="form.select.newOption" option={newOption} />
};

export default SelectFieldAdapter;