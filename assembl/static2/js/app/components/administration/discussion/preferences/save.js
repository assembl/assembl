// @flow
import type { ApolloClient } from 'react-apollo';
import UpdateDiscussionPreference from '../../../../graphql/mutations/updateDiscussionPreference.graphql';
import type { LanguagePreferencesFormValues } from './types.flow';
import { createSave } from '../../../form/utils';

const getVariables = async (client: ApolloClient, values: LanguagePreferencesFormValues) => {
  const remove = (array, element) => array.filter(el => el !== element);
  let localesArray = values.languages.map(language => language.locale);
  values.languages.forEach((language) => {
    if (values[language.locale] === false || !language.isChecked) {
      localesArray = remove(localesArray, language.locale);
    }
    if (values[language.locale] === true) {
      localesArray.push(language.locale);
    }
  });
  return {
    languages: localesArray
  };
};

export const createMutationsPromises = (client: ApolloClient) => (values: LanguagePreferencesFormValues) => [
  () =>
    getVariables(client, values).then(variables =>
      client.mutate({
        mutation: UpdateDiscussionPreference,
        variables: {
          ...variables
        }
      })
    )
];

export const save = createSave('administration.successLanguagePreference');