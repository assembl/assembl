// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button, Checkbox, Col, ControlLabel, Form as BootstrapForm, FormControl, FormGroup } from 'react-bootstrap';
import { Form, Field } from 'react-final-form';

const FormControlAdapter = ({ input: { name, onChange, value, ...otherListeners }, ...rest }) => (
  <FormControl
    {...otherListeners}
    {...rest}
    onChange={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(e.target.value);
    }}
    value={value || ''}
  />
);

const CheckboxAdapter = ({ children, input }) => <Checkbox {...input}>{children}</Checkbox>;

export type FormValues = {
  openInNewTab?: boolean,
  text?: string,
  url?: string
};

type Props = {
  initialValues: FormValues,
  onSubmit: Function
};

const AddLinkForm = ({ initialValues, onSubmit }: Props) => (
  <Form
    initialValues={initialValues}
    onSubmit={onSubmit}
    render={({ handleSubmit }) => (
      <BootstrapForm componentClass="div" horizontal>
        <FormGroup controlId="url">
          <Col componentClass={ControlLabel} sm={2}>
            <div className="richtext-label">
              <Translate value="common.editor.linkPlugin.url" />
            </div>
          </Col>
          <Col sm={10}>
            <Field name="url" component={FormControlAdapter} />
          </Col>
        </FormGroup>
        <FormGroup controlId="text">
          <Col componentClass={ControlLabel} sm={2}>
            <div className="richtext-label">
              <Translate value="common.editor.linkPlugin.text" />
            </div>
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
        <FormGroup className="margin-m">
          <Col sm={12}>
            <div className="center">
              <Button
                type="submit"
                className="button-submit button-dark"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }}
              >
                <Translate value="common.editor.linkPlugin.submit" />
              </Button>
            </div>
          </Col>
        </FormGroup>
      </BootstrapForm>
    )}
  />
);

export default AddLinkForm;