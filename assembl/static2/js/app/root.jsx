import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import Modal from './components/common/modal';
import Alert from './components/common/alert';
import { modalManager, alertManager } from './utils/utilityManager';

/*
  Some debate initiators want to embed their own tracking code.
  Note that HTML added via dangerouslySetInnerHTML does not execute <script> tags.
*/
const DebateCustomHTMLCode = ({ currentRoute, debateData }) => {
  if (currentRoute && debateData) {
    let customHtml = null;
    switch (currentRoute) {
    case ':slug/home': // for backend routes "new_home" and "bare_slug"
      if (debateData && 'customHtmlCodeLandingPage' in debateData) {
        customHtml = debateData.customHtmlCodeLandingPage;
      }
      break;

    case ':slug/signup': // for backend route "contextual_react_register"
      if (debateData && 'customHtmlCodeRegistrationPage' in debateData) {
        customHtml = debateData.customHtmlCodeRegistrationPage;
      }
      break;

    default:
      break;
    }

    if (customHtml) {
      return <div className="debate-custom-html-code" dangerouslySetInnerHTML={{ __html: customHtml }} />;
    }
  }
  return <div className="debate-custom-html-code" />;
};

/*
  Parent class of all of Assembl. All high level components that require
  to exist in every context should be placed here. Eg. Alert, Modal, etc.
*/
const Root = ({ children, routes, debateData }) => (
  <Fragment>
    <DebateCustomHTMLCode currentRoute={routes[routes.length - 1].path} debateData={debateData} />
    <Modal
      ref={(modalComponent) => {
        modalManager.setComponent(modalComponent);
      }}
    />
    <Alert
      isBase
      ref={(alertComponent) => {
        alertManager.setComponent(alertComponent);
      }}
    />
    <div className="root-child">{children}</div>
  </Fragment>
);

const mapStateToProps = state => ({
  debateData: state.debate.debateData
});

export default connect(mapStateToProps)(Root);