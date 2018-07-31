// @flow
/* Text field and file field

When a value is entered in text field, empty the file field,
when a file is chosen, empty the text field
*/
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup, FormControl } from 'react-bootstrap';

import FileUploader from '../common/fileUploader';
import Error from './error';
import { getValidationState } from './utils';

type Props = {
  fileFieldLabel: string,
  input: {
    name: string,
    onBlur: (?SyntheticFocusEvent<*>) => void,
    onChange: (SyntheticInputEvent<*> | any) => void,
    onFocus: (?SyntheticFocusEvent<*>) => void,
    value: {
      htmlCode: string,
      img: ?{
        externalUrl: string,
        title: string,
        mimeType: string
      }
    }
  },
  label: string
} & FieldRenderProps;

const TextOrFileFieldAdapter = ({
  fileFieldLabel,
  input: { name, onChange, value, ...otherListeners },
  label,
  meta: { error, touched },
  ...rest
}: Props) => {
  const onTextChange = event =>
    onChange({
      htmlCode: event.target.value,
      img: null
    });

  const onFileChange = fileValue =>
    onChange({
      htmlCode: '',
      img: fileValue
        ? {
          externalUrl: fileValue,
          title: fileValue.name,
          mimeType: fileValue.type
        }
        : null
    });

  return (
    <FormGroup validationState={getValidationState(error, touched)}>
      {value.htmlCode ? <ControlLabel htmlFor={name}>{label}</ControlLabel> : null}
      <FormControl {...otherListeners} {...rest} onChange={onTextChange} placeholder={label} value={value.htmlCode} />
      <div className="admin-help">
        <Translate value="administration.videoHelp" />
      </div>
      <ControlLabel htmlFor={name}>{fileFieldLabel}</ControlLabel>
      <FileUploader
        key={value.img ? value.img.externalUrl : 'empty'}
        fileOrUrl={value.img ? value.img.externalUrl : ''}
        imgTitle={value.img ? value.img.title : ''}
        handleChange={onFileChange}
        mimeType={value.img ? value.img.mimeType : ''}
        name={name}
        isAdminUploader
        onDeleteClick={() =>
          onChange({
            htmlCode: '',
            img: null
          })
        }
      />
      <Error name={name} />
    </FormGroup>
  );
};

export default TextOrFileFieldAdapter;