import React from 'react';
import { I18n } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import ResourcesQuery from '../graphql/ResourcesQuery.graphql';
import ResourcesCenterPageQuery from '../graphql/ResourcesCenterPage.graphql';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import ResourcesCenter from '../components/resourcesCenter';

const ResourcesCenterContainer = ({ data, resourcesCenterHeaderUrl, resourcesCenterTitle }) => {
  return <ResourcesCenter {...data} headerBackgroundUrl={resourcesCenterHeaderUrl} headerTitle={resourcesCenterTitle} />;
};

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    lang: state.i18n.locale
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(ResourcesCenterPageQuery, {
    props: ({ data, ownProps }) => {
      const defaultHeaderImage = ownProps.debate.debateData.headerBackgroundUrl || '';
      if (data.loading) {
        return {
          loading: true
        };
      }
      if (data.error) {
        return {
          hasErrors: true
        };
      }

      const title = data.resourcesCenter.title;
      const headerImage = data.resourcesCenter.headerImage;
      return {
        resourcesCenterTitle: title || I18n.t('resourcesCenter.defaultHeaderTitle'),
        resourcesCenterHeaderUrl: headerImage ? headerImage.externalUrl : defaultHeaderImage
      };
    }
  }),
  graphql(ResourcesQuery),
  withLoadingIndicator()
)(ResourcesCenterContainer);