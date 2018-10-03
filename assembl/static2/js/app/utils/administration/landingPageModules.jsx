/* Plugin for landing page administration */
import LandingPageModules from '../../graphql/LandingPageModules.graphql';
import createLandingPageModule from '../../graphql/mutations/createLandingPageModule.graphql';
import updateLandingPageModule from '../../graphql/mutations/updateLandingPageModule.graphql';

const landingPageModulesPlugin = {
  createMutation: createLandingPageModule,
  createMutationName: 'createLandingPageModule',
  updateMutation: updateLandingPageModule,
  updateMutationName: 'updateLandingPageModule',
  graphqlQuery: LandingPageModules,
  loading: 'landingPageModulesLoading',
  error: 'landingPageModulesError',
  queryOptions: ({ locale }) => ({
    variables: { lang: locale }
  }),
  dataToProps: ({ data }) => {
    if (data.error || data.loading) {
      return {
        landingPageModulesError: data.error,
        landingPageModulesLoading: data.loading,
        landingPageModules: []
      };
    }

    return {
      landingPageModulesLoading: data.loading,
      landingPageModulesError: data.error,
      refetchLandingPageModules: data.refetch,
      landingPageModules: data.landingPageModules
    };
  },
  variablesCreator: item => ({
    configuration: '{}',
    enabled: item.enabled,
    order: item.order,
    typeIdentifier: item.moduleType.identifier,
    titleEntries: item.titleEntries,
    subtitleEntries: item.subtitleEntries
  })
};

export default landingPageModulesPlugin;