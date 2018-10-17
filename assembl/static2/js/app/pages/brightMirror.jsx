import React from 'react';
import { compose, graphql } from 'react-apollo';
import ThematicsQuery from '../graphql/ThematicsQuery.graphql';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import { browserHistory } from '../router';
import { get } from '../utils/routeMap';
import { displayAlert } from '../utils/utilityManager';

class BrightMirror extends React.Component {
  componentDidMount() {
    const { thematics, params } = this.props;
    const isParentRoute = !params.themeId;
    // After fetching thematics, redirect to the only BM thematic
    if (isParentRoute && thematics.length > 0) {
      const themeId = thematics[0].id;
      browserHistory.push(`${get('idea', { slug: params.slug, phase: params.phase, themeId: themeId })}`);
    }
  }

  render() {
    const { errors, identifier, children, params, phaseId } = this.props;
    if (errors) {
      displayAlert('danger', `${errors}`);
      return <div />;
    }
    const childrenElm = React.Children.map(children, child =>
      React.cloneElement(child, {
        id: params.themeId,
        identifier: identifier,
        phaseId: phaseId
      })
    );
    return <div className="bright-mirror">{childrenElm}</div>;
  }
}

export default compose(
  graphql(ThematicsQuery, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        thematics: data.thematics
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: true })
)(BrightMirror);