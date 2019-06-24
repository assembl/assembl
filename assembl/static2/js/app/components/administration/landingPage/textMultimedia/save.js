// @flow
import type { ApolloClient } from 'react-apollo';

import MultilingualLandingPageModuleQuery from '../../../../graphql/MultilingualLandingPageModuleQuery.graphql';
import LandingPageModulesQuery from '../../../../graphql/LandingPageModulesQuery.graphql';
import updateLandingPageModule from '../../../../graphql/mutations/updateLandingPageModule.graphql';
import { convertRichTextToVariables, convertToEntries, createSave } from '../../../form/utils';
import { goToModulesAdmin } from '../utils';
import type { TextMultimediaFormValues } from './types.flow';

const getVariables = async (client: ApolloClient, values: TextMultimediaFormValues) => {
  const bodyVars = await convertRichTextToVariables(values.body, client);
  const { attachments: bodyAttachments, entries: bodyEntries } = bodyVars;
  return {
    titleEntries: convertToEntries(values.title),
    bodyEntries: bodyEntries,
    bodyAttachments: bodyAttachments
  };
};

export const createMutationsPromises = (client: ApolloClient, lang: string, landingPageModule: MultilingualLandingPageModule) => (
  values: TextMultimediaFormValues
) => [
  (): Promise<any> => {
    const vars = getVariables(client, values);
    const refetchQueries = [
      {
        query: LandingPageModulesQuery,
        variables: {
          lang: lang
        }
      }
    ];
    return vars
      .then(variables =>
        client.mutate({
          mutation: updateLandingPageModule,
          variables: {
            id: landingPageModule.id,
            ...variables
          },
          refetchQueries: [
            ...refetchQueries,
            {
              query: MultilingualLandingPageModuleQuery,
              variables: {
                id: landingPageModule.id,
                lang: lang
              }
            }
          ]
        })
      )
      .then(() => {
        goToModulesAdmin();
      });
  }
];

export const save = createSave('administration.landingPage.manageModules.successSave');