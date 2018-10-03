import React from 'react';
import { I18n } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import ResourcesQuery from '../graphql/ResourcesQuery.graphql';
import ResourcesCenterPageQuery from '../graphql/ResourcesCenterPage.graphql';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import ResourcesCenter from '../components/resourcesCenter';

const ResourcesCenterContainer = ({ data, resourcesCenterHeaderUrl, resourcesCenterTitle }) => (
  <ResourcesCenter {...data} headerBackgroundUrl={resourcesCenterHeaderUrl} headerTitle={resourcesCenterTitle} />
);

const mapStateToProps = state => ({
  debate: state.debate,
  lang: state.i18n.locale
});

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
      const { title, headerImage } = data.resourcesCenter;
      return {
        resourcesCenterTitle: title || I18n.t('resourcesCenter.defaultHeaderTitle'),
        resourcesCenterHeaderUrl: headerImage ? headerImage.externalUrl : defaultHeaderImage
      };
    }
  }),
  graphql(ResourcesQuery),
  manageErrorAndLoading({ displayLoader: true })
)(ResourcesCenterContainer);