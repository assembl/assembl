// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { type Route } from 'react-router';
import Modal from './components/common/modal';
import Alert from './components/common/alert';
import { modalManager, alertManager } from './utils/utilityManager';

import DebateCustomHTMLCode from './debateCustomHTMLCode';

type Props = {
  children: React.Node,
  routes: Array<Route>,
  debateData: DebateData
};

/*
  Parent class of all of Assembl. All high level components that require
  to exist in every context should be placed here. Eg. Alert, Modal, etc.
*/
const Root = ({ children, routes, debateData }: Props) => (
  <React.Fragment>
    <DebateCustomHTMLCode currentRoute={routes[routes.length - 1].path} debateData={debateData} />
    <Modal
      ref={(modalComponent) => {
        modalManager.setComponent(modalComponent);
      }}
    />
    <Alert
      isBase
      ref={(alertComponent: ?Alert) => {
        alertManager.setComponent(alertComponent);
      }}
    />
    <div className="root-child">{children}</div>
  </React.Fragment>
);

const mapStateToProps = state => ({
  debateData: state.debate.debateData
});

export default connect(mapStateToProps)(Root);