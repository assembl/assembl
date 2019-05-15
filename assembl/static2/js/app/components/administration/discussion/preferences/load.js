// @flow
import type { ApolloClient } from 'react-apollo';

import type { DiscussionPreferencesFormValues } from './types.flow';

import DiscussionPreferencesQuery from '../../../../graphql/DiscussionPreferences.graphql';
import LocalesQuery from '../../../../graphql/LocalesQuery.graphql';
import { availableLocales } from '../../../../constants';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, locale: string) => {
  const { data: availableLanguages } = await client.query({
    query: LocalesQuery,
    variables: { lang: locale },
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

type Data = LocalesQuery & DiscussionPreferencesQuery;

export function postLoadFormat(data: Data): DiscussionPreferencesFormValues {
  const { discussionPreferences, locales } = data;
  const isChecked = locale => discussionPreferences.languages.some(language => language.locale === locale);

  const filteredLanguages = locales.filter(lang => availableLocales.includes(lang.localeCode));

  const languages = filteredLanguages.map(language => ({
    isChecked: isChecked(language.localeCode),
    label: language.label,
    value: language.localeCode
  }));
  const { withModeration, withTranslation, withSemanticAnalysis, slug } = discussionPreferences;
  return {
    languages: languages,
    withModeration: withModeration,
    withTranslation: withTranslation,
    withSemanticAnalysis: withSemanticAnalysis,
    slug: slug
  };
}