// @flow
import type { ApolloClient } from 'react-apollo';
import type { TextMultimediaValues } from './types.flow';
import { convertRichTextToVariables, convertToEntries, createSave } from '../../../form/utils';
import updateDiscussionTextMultimedia from '../../../../graphql/mutations/updateDiscussionTextMultimedia.graphql';
import DiscussionQuery from '../../../../graphql/DiscussionQuery.graphql';

const getVariables = async (client: ApolloClient, values: TextMultimediaValues) => {
  const bodyVars = await convertRichTextToVariables(values.textMultimediaBody, client);
  const { attachments: textMultimediaBodyAttachments, entries: textMultimediaBodyEntries } = bodyVars;
  const data = {
    textMultimediaTitleEntries: convertToEntries(values.textMultimediaTitle),
    textMultimediaBodyEntries: textMultimediaBodyEntries,
    textMultimediaBodyAttachments: textMultimediaBodyAttachments
  };
  return data;
};

export const createMutationsPromises = (client: ApolloClient, lang: string) => (values: TextMultimediaValues) => [
  (): Promise<any> => {
    const vars = getVariables(client, values);
    const refetchQueries = [
      {
        query: DiscussionQuery,
        variables: {
          lang: lang
        }
      }
    ];
    return vars.then(variables =>
      client.mutate({
        mutation: updateDiscussionTextMultimedia,
        variables: {
          ...variables
        },
        refetchQueries: [
          ...refetchQueries,
          {
            query: DiscussionQuery,
            variables: {
              lang: lang
            }
          }
        ]
      })
    );
  }
];
export const save = createSave('administration.landingPage.manageModules.successSave');