// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button, Checkbox, Col, ControlLabel, Form as BootstrapForm, FormControl, FormGroup } from 'react-bootstrap';
import { Form, Field } from 'react-final-form';

const FormControlAdapter = ({ input: { name, onChange, value, ...otherListeners }, ...rest }) => (
  <FormControl {...otherListeners} {...rest} onChange={event => onChange(event.target.value)} value={value || ''} />
);

const CheckboxAdapter = ({ children, input }) => <Checkbox {...input}>{children}</Checkbox>;

type Props = {
  defaultText: string,
  onSubmit: Function
};

const AddLinkForm = ({ defaultText, onSubmit }: Props) => (
  <React.Fragment>
    <Form
      initialValues={{
        text: defaultText
      }}
      onSubmit={onSubmit}
      render={({ handleSubmit }) => (
        <BootstrapForm horizontal onSubmit={handleSubmit}>
          <FormGroup controlId="url">
            <Col componentClass={ControlLabel} sm={2}>
              <Translate value="common.editor.linkPlugin.url" />
            </Col>
            <Col sm={10}>
              <Field name="url" component={FormControlAdapter} />
            </Col>
          </FormGroup>
          <FormGroup controlId="text">
            <Col componentClass={ControlLabel} sm={2}>
              <Translate value="common.editor.linkPlugin.text" />
            </Col>
            <Col sm={10}>
              <Field name="text" component={FormControlAdapter} />
            </Col>
          </FormGroup>
          <FormGroup controlId="openInNewTab">
            <Col smOffset={2} sm={10}>
              <Field name="openInNewTab" component={CheckboxAdapter} type="checkbox">
                <Translate value="common.editor.linkPlugin.openInNewTab" />
              </Field>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col smOffset={2} sm={10}>
              <Button type="submit">
                <Translate value="common.editor.linkPlugin.submit" />
              </Button>
            </Col>
          </FormGroup>
        </BootstrapForm>
      )}
    />
  </React.Fragment>
);

export default AddLinkForm;