// @flow
import * as React from 'react';
import { Button, Form as BootstrapForm, FormGroup } from 'react-bootstrap';
import { Form, Field } from 'react-final-form';
import { Translate } from 'react-redux-i18n';

import FileUploaderFieldAdapter from '../../../../js/app/components/form/fileUploaderFieldAdapter';

export type AddAttachmentFormValues = {
  file: {
    externalUrl: string,
    imgTitle: string,
    mimeType: string
  }
};

type Props = {
  onSubmit: (values: AddAttachmentFormValues) => void
};

const AddAttachmentForm = ({ onSubmit }: Props) => (
  <Form
    onSubmit={onSubmit}
    render={({ handleSubmit }) => (
      <BootstrapForm componentClass="div" horizontal>
        <div className="center">
          <Field name="file" component={FileUploaderFieldAdapter} />
          <FormGroup>
            <Button
              type="submit"
              className="button-submit button-dark"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }}
            >
              <Translate value="validate" />
            </Button>
          </FormGroup>
        </div>
      </BootstrapForm>
    )}
  />
);

export default AddAttachmentForm;