// @flow
/*
  Form with save button and a popup that notifies user if he leaves the form with unsaved data
*/
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
import { type Route, type Router, withRouter } from 'react-router';

import SaveButton from '../administration/saveButton';

type Props = {
  children: React.Node,
  handleSubmit: Function,
  pristine: boolean,
  routes: Array<Route>,
  router: Router,
  submitting: boolean,
  disableSave?: boolean
};

export class DumbAdminForm extends React.Component<Props> {
  componentDidMount() {
    const route = this.props.routes.slice(-1)[0];
    this.props.router.setRouteLeaveHook(route, this.routerWillLeave);
  }

  componentWillUnmount() {
    const route = this.props.routes.slice(-1)[0];
    this.props.router.setRouteLeaveHook(route, null);
  }

  routerWillLeave = () => {
    const { pristine, submitting } = this.props;
    if (!pristine && !submitting) {
      return I18n.t('administration.confirmUnsavedChanges');
    }

    return null;
  };

  render() {
    const { children, handleSubmit, pristine, submitting, disableSave } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <SaveButton disabled={pristine || submitting || disableSave} saveAction={handleSubmit} />
        {children}
      </form>
    );
  }
}

export default withRouter(DumbAdminForm);