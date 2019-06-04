// @flow
/*
  Form with save button and a popup that notifies user if he leaves the form with unsaved data
*/
import * as React from 'react';

import FormWithRouter from './formWithRouter';
import SaveButton from '../administration/saveButton';

type Props = {
  children: React.Node,
  handleSubmit: Function,
  pristine: boolean,
  submitting: boolean,
  disableSave?: boolean
};

export class AdminForm extends React.Component<Props> {
  render() {
    const { children, handleSubmit, pristine, submitting, disableSave } = this.props;
    return (
      <FormWithRouter handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
        <SaveButton disabled={pristine || submitting || disableSave} saveAction={handleSubmit} />
        {children}
      </FormWithRouter>
    );
  }
}

export default AdminForm;