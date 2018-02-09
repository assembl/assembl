/* Plugin for landing page administration */
import LandingPageModules from '../../graphql/LandingPageModules.graphql';
import createLandingPageModule from '../../graphql/mutations/createLandingPageModule.graphql';
import updateLandingPageModule from '../../graphql/mutations/updateLandingPageModule.graphql';

const landingPagePlugin = {
  createMutation: createLandingPageModule,
  createMutationName: 'createLandingPageModule',
  updateMutation: updateLandingPageModule,
  updateMutationName: 'updateLandingPageModule',
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
  },
  variablesCreator: item => ({
    configuration: '{}',
    enabled: item.enabled,
    order: item.order,
    typeIdentifier: item.moduleType.identifier
  })
};

export default landingPagePlugin;