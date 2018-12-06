// @flow
import type { ApolloClient } from 'react-apollo';
import LanguagePreferencesQuery from '../../../../graphql/AllLanguagePreferences.graphql';
import DiscussionPreferencesLanguageQuery from '../../../../graphql/DiscussionPreferenceLanguage.graphql';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, locale: string) => {
  const availableLanguages = await client.query({
    query: LanguagePreferencesQuery,
    variables: { inLocale: locale },
    fetchPolicy: fetchPolicy
  });

  const userLanguagePreferences = await client.query({
    query: DiscussionPreferencesLanguageQuery,
    variables: { inLocale: locale },
    fetchPolicy: fetchPolicy
  });

  return {
    availableLanguages: availableLanguages.data,
    userLanguagePreferences: userLanguagePreferences.data
  };
};

export const postLoadFormat = (preferences: {
  availableLanguages: LanguagePreferencesQuery,
  userLanguagePreferences: DiscussionPreferencesLanguageQuery
}) => {
  const { defaultPreferences } = preferences.availableLanguages;
  const { discussionPreferences } = preferences.userLanguagePreferences;
  const isChecked = locale => discussionPreferences.languages.some(language => language.locale === locale);
  const languages = defaultPreferences.languages.map(language => ({
    ...language,
    isChecked: isChecked(language.locale)
  }));
  return {
    languages: languages
  };
};