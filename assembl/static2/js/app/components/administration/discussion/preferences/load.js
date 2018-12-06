// @flow
import type { ApolloClient } from 'react-apollo';

import type { LanguagePreferencesFormValues } from './types.flow';

import LanguagePreferencesQuery from '../../../../graphql/AllLanguagePreferences.graphql';
import DiscussionPreferencesLanguageQuery from '../../../../graphql/DiscussionPreferenceLanguage.graphql';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, locale: string) => {
  const { data: availableLanguages } = await client.query({
    query: LanguagePreferencesQuery,
    variables: { inLocale: locale },
    fetchPolicy: fetchPolicy
  });

  const { data: userLanguagePreferences } = await client.query({
    query: DiscussionPreferencesLanguageQuery,
    variables: { inLocale: locale },
    fetchPolicy: fetchPolicy
  });

  return {
    ...availableLanguages,
    ...userLanguagePreferences
  };
};

type Data = LanguagePreferencesQuery & DiscussionPreferencesLanguageQuery;

export function postLoadFormat(data: Data): LanguagePreferencesFormValues {
  const { defaultPreferences, discussionPreferences } = data;
  const isChecked = locale => discussionPreferences.languages.some(language => language.locale === locale);
  const languages = defaultPreferences.languages.map(language => ({
    ...language,
    isChecked: isChecked(language.locale)
  }));

  return {
    languages: languages
  };
}