// @flow
import * as React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup, Tooltip } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import FileUploader from '../common/fileUploader';
import Error from './error';
import { getValidationState } from './utils';
import { confirmDeletionModal } from './fieldArrayWithActions';

type Props = {
  deleteTooltip: ?React.Element<Tooltip>,
  label: string
} & FieldRenderProps;

const FileUploaderFieldAdapter = ({ deleteTooltip, input, label, meta: { error, touched } }: Props) => {
  const confirmDeletionTitle = <Translate value="deleteConfirmation.confirmDeletionTitle" />;
  const confirmDeletionBody = <Translate value="deleteConfirmation.confirmDeletionBody" />;
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
        deleteFileTooltip={deleteTooltip}
        key={input.value ? 'notEmpty' : 'empty'}
        fileOrUrl={input.value && input.value.externalUrl}
        imgTitle={input.value && input.value.title}
        handleChange={onChange}
        mimeType={input.value && input.value.mimeType}
        name={input.name}
        isAdminUploader
        onDeleteClick={() => confirmDeletionModal(confirmDeletionTitle, confirmDeletionBody, () => input.onChange(''))}
      />
      <Error name={input.name} />
    </FormGroup>
  );
};

export default FileUploaderFieldAdapter;