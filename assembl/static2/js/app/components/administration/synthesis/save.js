// @flow
import type { ApolloClient } from 'react-apollo';
import createSynthesis from '../../../graphql/mutations/createSynthesis.graphql';
import type { SynthesisFormValues } from './types.flow';

import { convertRichTextToVariables, convertToEntries, createSave, getFileVariable } from '../../form/utils';

const getVariables = async (client: ApolloClient, values: SynthesisFormValues, initialValues: SynthesisFormValues) => {
  const bodyVars = await convertRichTextToVariables(values.body, client);
  const { entries: bodyEntries } = bodyVars;

  const subjectEntries = convertToEntries(values.subject);
  const image = getFileVariable(values.image, initialValues.image);
  return {
    synthesisType: 'fulltext_synthesis',
    subjectEntries,
    bodyEntries,
    image,
  };
};

export const createMutationsPromises = (client: ApolloClient) =>
  (values: SynthesisFormValues, initialValues: SynthesisFormValues) => [
    () =>
      getVariables(client, values, initialValues).then(variables =>
        client.mutate({
          mutation: createSynthesis,
          variables: {
            ...variables
          }
        })
      )
  ];

export const save = createSave('debate.syntheses.successSave');