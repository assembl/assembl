// @flow
import type { ApolloClient } from 'react-apollo';
import UpdateDiscussionPreference from '../../../../graphql/mutations/updateDiscussionPreference.graphql';
import type { DiscussionPreferencesFormValues } from './types.flow';
import { createSave, convertCheckboxListValueToVariable } from '../../../form/utils';
import { get } from '../../../../utils/routeMap';
import { SECTION_DISCUSSION_PREFERENCES } from '../../../../constants';

const getVariables = async (client: ApolloClient, values: DiscussionPreferencesFormValues) => ({
  languages: convertCheckboxListValueToVariable(values.languages),
  withModeration: values.withModeration,
  withTranslation: values.withTranslation,
  withSemanticAnalysis: values.withSemanticAnalysis,
  slug: values.slug
});

export const createMutationsPromises = (client: ApolloClient) => (
  values: DiscussionPreferencesFormValues,
  initialValues: DiscussionPreferencesFormValues
) => [
  () =>
    getVariables(client, values).then(variables =>
      client
        .mutate({
          mutation: UpdateDiscussionPreference,
          variables: {
            ...variables
          }
        })
        .then(() => {
          if (values.slug !== initialValues.slug) {
            // When the slug is changed we need to redirect the user to the updated url with the new slug
            window.location.assign(
              get('administration', { slug: values.slug, id: 'discussion' }, { section: SECTION_DISCUSSION_PREFERENCES })
            );
          }
        })
    )
];

export const save = createSave('administration.successDiscussionPreference');