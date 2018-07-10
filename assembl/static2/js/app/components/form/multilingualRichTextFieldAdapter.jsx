// @flow
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup, HelpBlock } from 'react-bootstrap';

import RichTextEditor from '../common/richTextEditor';

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
    <FormGroup>
      {valueInLocale ? <ControlLabel htmlFor={name}>{label}</ControlLabel> : null}
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
      {touched && error ? <HelpBlock>{error}</HelpBlock> : null}
    </FormGroup>
  );
};

export default RichTextFieldAdapter;