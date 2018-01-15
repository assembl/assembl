/* Plugin for landing page administration */
import LandingPageModules from '../../graphql/LandingPageModules.graphql';

const landingPagePlugin = {
  graphqlQuery: LandingPageModules,
  loading: 'landingPageLoading',
  hasErrors: 'landingPageHasErrors',
  queryOptions: ({ i18n }) => ({
    variables: { lang: i18n.locale }
  }),
  dataToProps: ({ data }) => {
    if (data.loading) {
      return {
        landingPageLoading: true,
        landingPageModules: []
      };
    }

    if (data.error) {
      return {
        landingPageHasErrors: true,
        landingPageLoading: false,
        landingPageModules: []
      };
    }

    return {
      landingPageLoading: data.loading,
      landingPageHasErrors: data.error,
      refetchLandingPageModules: data.refetch,
      landingPageModules: data.landingPageModules
    };
  }
};

export default landingPagePlugin;