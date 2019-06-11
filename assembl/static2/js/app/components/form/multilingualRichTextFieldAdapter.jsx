// @flow
import { EditorState } from 'draft-js';
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { FormGroup, HelpBlock } from 'react-bootstrap';

import RichTextEditor from '../common/richTextEditor';
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
  label: string,
  toolbarPosition: ToolbarPosition,
  withAttachmentButton: boolean,
  withCharacterCounter: number
} & FieldRenderProps;

const RichTextFieldAdapter = ({
  editLocale,
  input: { name, onBlur, onChange, value, ...otherListeners },
  label,
  meta: { error, touched },
  toolbarPosition,
  withAttachmentButton,
  withCharacterCounter,
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
        onChange={es => onChange({ ...value, [editLocale]: es })}
        toolbarPosition={toolbarPosition}
        withAttachmentButton={withAttachmentButton}
        withCharacterCounter={withCharacterCounter}
      />
      {/* Warning: we can't use Error component here because having 2 fields with the same name breaks links in Editor */}
      {touched && error ? <HelpBlock>{error}</HelpBlock> : null}
    </FormGroup>
  );
};

RichTextFieldAdapter.defaultProps = {
  toolbarPosition: 'bottom',
  withAttachmentButton: false
};

export default RichTextFieldAdapter;