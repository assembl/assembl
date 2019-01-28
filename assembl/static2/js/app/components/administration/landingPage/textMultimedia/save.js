// @flow
import { convertToEntries, convertRichTextToVariables, createSave } from '../../../form/utils';

const getTextAndMultimediaVariables = async (
  values: TextAndMultimediaValues,
  initialValues: TextAndMultimediaValues,
  client: ApolloClient
) => {
  const bodyVars = await convertRichTextToVariables(values.body, client);
  console.log('bodyVars', bodyVars);
  const { attachments: bodyAttachments, entries: bodyEntries } = bodyVars;
  return {
    titleEntries: convertToEntries(values.title),
    bodyEntries: bodyEntries,
    bodyAttachments: bodyAttachments,
    layout: values.layout
  };
};

export const createMutationsPromises = (client: ApolloClient) => (values: TextAndMultimediaValues) => [
  () =>
    getTextAndMultimediaVariables(client, values).then(variables =>
      client.mutate({
        mutation: updateTextAndMultimedia,
        variables: {
          ...variables
        }
      })
    )
];

export const save = createSave('administration.landingPage.manageModules.successSave');