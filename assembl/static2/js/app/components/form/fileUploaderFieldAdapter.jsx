// @flow
import * as React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup, Tooltip, Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import { displayModal, closeModal } from '../../utils/utilityManager';
import FileUploader from '../common/fileUploader';
import Error from './error';
import { getValidationState } from './utils';

type Props = {
  deleteTooltip: ?React.Element<Tooltip>,
  label: string
} & FieldRenderProps;

const FileUploaderFieldAdapter = ({ deleteTooltip, input, label, meta: { error, touched } }: Props) => {
  const confirmDeletionTitle = <Translate value="deleteConfirmation.confirmDeletionTitle" />;
  const confirmDeletionBody = <Translate value="deleteConfirmation.confirmDeletionBody" />;
  const confirmDeletionModal = () => {
    const footer = [
      <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="cancel" />
      </Button>,
      <Button
        key="delete"
        onClick={() => {
          input.onChange('');
          closeModal();
        }}
        className="button-submit button-dark"
      >
        <Translate value="delete" />
      </Button>
    ];
    return displayModal(confirmDeletionTitle, confirmDeletionBody, true, footer);
  };

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
        onDeleteClick={() => confirmDeletionModal()}
      />
      <Error name={input.name} />
    </FormGroup>
  );
};

export default FileUploaderFieldAdapter;