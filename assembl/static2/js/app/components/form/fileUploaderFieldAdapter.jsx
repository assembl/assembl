// @flow
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, HelpBlock, FormGroup } from 'react-bootstrap';

import FileUploader from '../common/fileUploader';
import { getValidationState } from './utils';

type Props = {
  label: string
} & FieldRenderProps;

const FileUploaderFieldAdapter = ({ input, label, meta: { error, touched } }: Props) => {
  const onChange = (value) => {
    input.onChange({
      externalUrl: value,
      imgTitle: value.name,
      mimeType: value.type
    });
  };
  return (
    <FormGroup controlId={input.name} validationState={getValidationState(error, touched)}>
      <ControlLabel>{label}</ControlLabel>
      <FileUploader
        key={input.value ? 'notEmpty' : 'empty'}
        fileOrUrl={input.value && input.value.externalUrl}
        imgTitle={input.value && input.value.title}
        handleChange={onChange}
        mimeType={input.value && input.value.mimeType}
        name={input.name}
        isAdminUploader
        onDeleteClick={() => input.onChange('')}
      />
      {touched && error ? <HelpBlock>{error}</HelpBlock> : null}
    </FormGroup>
  );
};

export default FileUploaderFieldAdapter;