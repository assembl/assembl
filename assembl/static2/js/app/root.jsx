// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import type { OperationComponent } from 'react-apollo';
import { type Route } from 'react-router';
import { modalManager, alertManager } from './utils/utilityManager';

import Modal from './components/common/modal';
import Alert from './components/common/alert';
import DebateCustomHTMLCode from './debateCustomHTMLCode';

// Helper and HOC imports
import manageErrorAndLoading from './components/common/manageErrorAndLoading';

// GraphQL imports
import DiscussionPreferencesQuery from './graphql/DiscussionPreferencesQuery.graphql';

// Assembl Global theme
import { GlobalStyle } from './assemblTheme';

// @aryan: add availableLanguages: Array<String>

type Props = {
  children: React.Node,
  debateData: DebateData,
  /** Discussion preferences fetched from GraphQL */
  discussionPreferences: DiscussionPreferencesQuery,
  routes: Array<Route>
};

/*
  Parent class of all of Assembl. All high level components that require
  to exist in every context should be placed here. Eg. Alert, Modal, etc.
*/
const Root = (props: Props) => {
  const { children, debateData, discussionPreferences, routes } = props;
  const { firstColor, secondColor } = discussionPreferences;
  const theme = {
    firstColor: firstColor,
    secondColor: secondColor
  };

  return (
    <React.Fragment>
      <GlobalStyle {...theme} />
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
  debateData: state.debate.debateData
});

const discussionPreferencesQuery: OperationComponent<DiscussionPreferencesQuery, null, Props> = graphql(
  DiscussionPreferencesQuery,
  {
    props: ({ data }) => data
  }
);

export default compose(connect(mapStateToProps), discussionPreferencesQuery, manageErrorAndLoading({ displayLoader: true }))(
  Root
);