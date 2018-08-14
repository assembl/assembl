import React from 'react';
import { compose, graphql } from 'react-apollo';
import Loader from '../components/common/loader';
import ThematicsQuery from '../graphql/ThematicsQuery.graphql';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import { browserHistory } from '../router';
import { get } from '../utils/routeMap';
import { displayAlert } from '../utils/utilityManager';

class BrightMirror extends React.Component {
  componentDidMount() {
    const { data, params } = this.props;
    const isParentRoute = !params.themeId || false;
    // After fetching thematics, redirect to the only BM thematic
    if (isParentRoute && data.thematics.length > 0) {
      const themeId = data.thematics[0].id;
      browserHistory.push(`${get('idea', { slug: params.slug, phase: params.phase, themeId: themeId })}`);
    }
  }

  render() {
    const { data, hasErrors, identifier, loading, children, params } = this.props;
    const isParentRoute = !!params.themeId || false;
    if (hasErrors) {
      displayAlert('danger', `${data.error}`);
      return <div />;
    }
    if (isParentRoute && loading) {
      return (
        <div className="debate">
          {loading && isParentRoute && <Loader color="black" />}
        </div>
      );
    }
    const childrenElm = React.Children.map(children, child =>
      React.cloneElement(child, {
        id: params.themeId,
        identifier: identifier
      })
    );
    return (
      <div>
        <section className="debate-section">{childrenElm}</section>
      </div>
    );
  }
}

export default compose(
  graphql(ThematicsQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return {
          loading: true
        };
      }

      if (data.error) {
        return {
          hasErrors: true,
          data: data,
          loading: false
        };
      }

      return {
        hasErrors: false,
        data: data,
        loading: false
      };
    }
  }),
  withLoadingIndicator()
)(BrightMirror);