// @flow
import { EditorState } from 'draft-js';
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { FormGroup } from 'react-bootstrap';

import RichTextEditor from '../common/richTextEditor';
import Error from './error';
import { getValidationState } from './utils';

type multilingualValue = { [string]: EditorState };

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
  input: { name, onBlur, onChange, value, ...otherListeners },
  label,
  meta: { error, touched },
  ...rest
}: Props) => {
  const valueInLocale = value[editLocale] || EditorState.createEmpty();
  return (
    <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
      <RichTextEditor
        {...otherListeners}
        {...rest}
        editorState={valueInLocale}
        placeholder={label}
        toolbarPosition="bottom"
        onChange={es => onChange({ ...value, [editLocale]: es })}
        withAttachmentButton={false}
      />
      <Error name={name} />
    </FormGroup>
  );
};

export default RichTextFieldAdapter;