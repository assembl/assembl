// @flow
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup } from 'react-bootstrap';

import RichTextEditor from '../common/richTextEditor';
import Error from './error';
import { getValidationState } from './utils';

type multilingualValue = { [string]: string };

type Props = {
  editLocale: string,
  input: {
    name: string,
    onBlur: (?SyntheticFocusEvent<*>) => void,
    onChange: (SyntheticInputEvent<*> | any) => void,
    onFocus: (?SyntheticFocusEvent<*>) => void,
    value: multilingualValue
  },
  label: string
} & FieldRenderProps;

const RichTextFieldAdapter = ({
  editLocale,
  input: { name, onChange, value, ...otherListeners },
  label,
  meta: { error, touched },
  ...rest
}: Props) => {
  const valueInLocale = value[editLocale] || null;
  const key = valueInLocale ? 'notEmpty' : 'empty';
  return (
    <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
      {valueInLocale ? <ControlLabel>{label}</ControlLabel> : null}
      <RichTextEditor
        {...otherListeners}
        {...rest}
        key={key}
        rawContentState={valueInLocale}
        placeholder={label}
        toolbarPosition="bottom"
        updateContentState={cs => onChange({ ...value, [editLocale]: cs })}
        withAttachmentButton={false}
      />
      <Error name={name} />
    </FormGroup>
  );
};

export default RichTextFieldAdapter;