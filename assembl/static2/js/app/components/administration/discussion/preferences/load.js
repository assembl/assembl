// @flow
import type { ApolloClient } from 'react-apollo';

import type { DiscussionPreferencesFormValues } from './types.flow';

import LanguagePreferencesQuery from '../../../../graphql/AllLanguagePreferences.graphql';
import DiscussionPreferencesQuery from '../../../../graphql/DiscussionPreferences.graphql';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, locale: string) => {
  const { data: availableLanguages } = await client.query({
    query: LanguagePreferencesQuery,
    variables: { inLocale: locale },
    fetchPolicy: fetchPolicy
  });

  const { data: discussionPreferences } = await client.query({
    query: DiscussionPreferencesQuery,
    variables: { inLocale: locale },
    fetchPolicy: fetchPolicy
  });

  return {
    ...availableLanguages,
    ...discussionPreferences
  };
};

type Data = LanguagePreferencesQuery & DiscussionPreferencesQuery;

export function postLoadFormat(data: Data): DiscussionPreferencesFormValues {
  const { defaultPreferences, discussionPreferences } = data;
  const isChecked = locale => discussionPreferences.languages.some(language => language.locale === locale);
  const languages = defaultPreferences.languages.map(language => ({
    isChecked: isChecked(language.locale),
    label: language.name,
    value: language.locale
  }));
  return {
    languages: languages,
    withModeration: discussionPreferences.withModeration,
    slug: discussionPreferences.slug
  };
}