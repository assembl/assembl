// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { graphql, withApollo } from 'react-apollo';

import TextMultimedia from '../../components/administration/landingPage/textMultimedia';
import MultilingualLandingPageModule from '../../graphql/MultilingualLandingPageModuleQuery.graphql';
import manageErrorAndLoading from '../../components/common/manageErrorAndLoading';

type Props = {
  editLocale: string,
  landingPageModule: MultilingualLandingPageModuleQuery
};

type State = {
  refetching: boolean
};

class TextAndMultimediaAdminPage extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      refetching: false
    };
  }

  render() {
    const { editLocale, landingPageModule } = this.props;
    return (
      <div className="landing-page-admin">
        <TextMultimedia editLocale={editLocale} landingPageModule={landingPageModule} />
      </div>
    );
  }
}

const mapStateToProps = ({ i18n: { locale }, admin: { editLocale, landingPage } }) => ({
  lang: locale,
  landingPage: landingPage,
  editLocale: editLocale
});

export default compose(
  connect(mapStateToProps),
  graphql(MultilingualLandingPageModule, {
    options: props => ({
      variables: { id: props.landingPageModuleId, lang: props.lang }
    }),
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
        landingPageModule: data.landingPageModule
      };
    }
  }),
  withApollo,
  manageErrorAndLoading({ displayLoader: true })
)(TextAndMultimediaAdminPage);