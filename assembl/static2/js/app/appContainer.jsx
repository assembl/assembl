// @flow
import * as React from 'react';
import { compose, graphql, type OperationComponent } from 'react-apollo';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import manageErrorAndLoading from './components/common/manageErrorAndLoading';
import CoreDiscussionPreferencesQuery from './graphql/CoreDiscussionPreferencesQuery.graphql';

type Props = {
  children: React.Node
  // discussionPreferences: CoreDiscussionPreferencesQuery
};

const DumbApplicationContainer = (props: Props) => {
  const { children } = props;
  // console.log('[DumbAppContainer] with props', props);

  // Application-levle default configurations are made here

  return <React.Fragment>{children}</React.Fragment>;
};

const discussionPreferencesQuery: OperationComponent<CoreDiscussionPreferencesQuery, null, Props> = graphql(
  CoreDiscussionPreferencesQuery,
  {
    props: ({ data }) => data
  }
);

const mapDispatchToProps = dispatch => ({
  setDefaultLocale: locale => dispatch(setLocale(locale))
});

export default compose(
  discussionPreferencesQuery,
  connect(null, mapDispatchToProps),
  manageErrorAndLoading({ displayLoader: true })
)(DumbApplicationContainer);