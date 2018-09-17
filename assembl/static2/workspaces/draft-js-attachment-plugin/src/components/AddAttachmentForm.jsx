// @flow
import * as React from 'react';
import { Button, Col, Form as BootstrapForm, FormGroup } from 'react-bootstrap';
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
  onSubmit: Function
};

const AddAttachmentForm = ({ onSubmit }: Props) => (
  <Form
    onSubmit={onSubmit}
    render={({ handleSubmit }) => (
      <BootstrapForm componentClass="div" horizontal>
        <Field name="file" component={FileUploaderFieldAdapter} />
        <FormGroup>
          <Col smOffset={2} sm={10}>
            <Button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }}
            >
              <Translate value="common.editor.linkPlugin.submit" />
            </Button>
          </Col>
        </FormGroup>
      </BootstrapForm>
    )}
  />
);

export default AddAttachmentForm;