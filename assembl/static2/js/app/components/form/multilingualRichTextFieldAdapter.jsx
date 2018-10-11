// @flow
import { EditorState } from 'draft-js';
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { type FieldRenderProps } from 'react-final-form';
import { FormGroup } from 'react-bootstrap';
import uploadDocumentMutation from '../../graphql/mutations/uploadDocument.graphql';

import RichTextEditor from '../common/richTextEditor';
import Error from './error';
import { getValidationState } from './utils';
import attachmentsPlugin from '../common/richTextEditor/attachmentsPlugin';

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
  uploadDocument: Function,
  withAttachment: boolean
} & FieldRenderProps;

const RichTextFieldAdapter = ({
  editLocale,
  uploadDocument,
  withAttachment,
  input: { name, onBlur, onChange, value, ...otherListeners },
  label,
  meta: { error, touched },
  ...rest
}: Props) => {
  const valueInLocale = value[editLocale] || EditorState.createEmpty();
  if (withAttachment) {
    attachmentsPlugin.uploadNewAttachments(valueInLocale, uploadDocument);
  }
  return (
    <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
      <RichTextEditor
        {...otherListeners}
        {...rest}
        editorState={valueInLocale}
        placeholder={label}
        toolbarPosition="bottom"
        onChange={es => onChange({ ...value, [editLocale]: es })}
        withAttachmentButton={withAttachment}
      />
      <Error name={name} />
    </FormGroup>
  );
};

RichTextFieldAdapter.defaultProps = {
  withAttachment: false
};

export default compose(graphql(uploadDocumentMutation, { name: 'uploadDocument' }))(RichTextFieldAdapter);