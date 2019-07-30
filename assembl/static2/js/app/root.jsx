// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { type Route } from 'react-router';
import { modalManager, alertManager } from './utils/utilityManager';
import Modal from './components/common/modal';
import Alert from './components/common/alert';
import DebateCustomHTMLCode from './debateCustomHTMLCode';

// Global theme
import { GlobalStyle } from './globalTheme';

type Props = {
  children: React.Node,
  debateData: DebateData,
  routes: Array<Route>,
  theme: Theme
};

/*
  Parent class of all of Assembl. All high level components that require
  to exist in every context should be placed here. Eg. Alert, Modal, etc.
*/
const Root = (props: Props) => {
  const { children, debateData, routes, theme } = props;

  return (
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
};

const mapStateToProps = state => ({
  debateData: state.debate.debateData,
  theme: state.theme
});

export default connect(mapStateToProps)(Root);