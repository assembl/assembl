// @flow
import type { ApolloClient } from 'react-apollo';
import createSynthesis from '../../../graphql/mutations/createSynthesis.graphql';
import updateSynthesis from '../../../graphql/mutations/updateSynthesis.graphql';
import type { SynthesisFormValues } from './types.flow';

import { convertRichTextToVariables, convertToEntries, createSave, getFileVariable } from '../../form/utils';
import SynthesesQuery from '../../../graphql/SynthesesQuery.graphql';

const getVariables = async (client: ApolloClient, values: SynthesisFormValues, initialValues: SynthesisFormValues) => {
  const bodyVars = await convertRichTextToVariables(values.body, client);
  const { entries: bodyEntries } = bodyVars;

  const subjectEntries = convertToEntries(values.subject);
  const image = getFileVariable(values.image, initialValues.image);
  return {
    synthesisType: 'fulltext_synthesis',
    publicationState: values.publicationState,
    subjectEntries: subjectEntries,
    bodyEntries: bodyEntries,
    image: image
  };
};

export const createMutationsPromises = (client: ApolloClient, lang: string, synthesisPostId?: string) => (
  values: SynthesisFormValues,
  initialValues: SynthesisFormValues
) => [
  (): Promise<any> => {
    const vars = getVariables(client, values, initialValues);
    const refetchQueries = [
      {
        query: SynthesesQuery,
        variables: {
          lang: lang
        }
      }
    ];
    if (!synthesisPostId) {
      return vars.then(variables =>
        client.mutate({
          mutation: createSynthesis,
          variables: {
            ...variables
          },
          refetchQueries: refetchQueries
        })
      );
    }
    return vars.then(variables =>
      client.mutate({
        mutation: updateSynthesis,
        variables: {
          id: synthesisPostId,
          ...variables
        },
        refetchQueries: refetchQueries
      })
    );
  }
];

export const save = createSave('debate.syntheses.successSave');