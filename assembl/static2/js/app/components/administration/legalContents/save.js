// @flow
import type { ApolloClient } from 'react-apollo';
import updateLegalContents from '../../../graphql/mutations/updateLegalContents.graphql';
import type { LegalContentsFormValues } from './types.flow';
import { createSave, convertRichTextToVariables } from '../../form/utils';

const getVariables = async (client: ApolloClient, values: LegalContentsFormValues) => {
  const legalNoticeVars = await convertRichTextToVariables(values.legalNotice, client);
  const { attachments: legalNoticeAttachments, entries: legalNoticeEntries } = legalNoticeVars;

  const tacVars = await convertRichTextToVariables(values.termsAndConditions, client);
  const { attachments: termsAndConditionsAttachments, entries: termsAndConditionsEntries } = tacVars;

  const privacyPolicyVars = await convertRichTextToVariables(values.privacyPolicy, client);
  const { attachments: privacyPolicyAttachments, entries: privacyPolicyEntries } = privacyPolicyVars;

  const cookiesPolicyVars = await convertRichTextToVariables(values.cookiesPolicy, client);
  const { attachments: cookiesPolicyAttachments, entries: cookiesPolicyEntries } = cookiesPolicyVars;

  const userGuidelinesVars = await convertRichTextToVariables(values.userGuidelines, client);
  const { attachments: userGuidelinesAttachments, entries: userGuidelinesEntries } = userGuidelinesVars;

  return {
    cookiesPolicyAttachments: cookiesPolicyAttachments,
    legalNoticeAttachments: legalNoticeAttachments,
    privacyPolicyAttachments: privacyPolicyAttachments,
    termsAndConditionsAttachments: termsAndConditionsAttachments,
    userGuidelinesAttachments: userGuidelinesAttachments,
    cookiesPolicyEntries: cookiesPolicyEntries,
    legalNoticeEntries: legalNoticeEntries,
    termsAndConditionsEntries: termsAndConditionsEntries,
    privacyPolicyEntries: privacyPolicyEntries,
    userGuidelinesEntries: userGuidelinesEntries
  };
};

export const createMutationsPromises = (client: ApolloClient) => (values: LegalContentsFormValues) => [
  () =>
    getVariables(client, values).then(variables =>
      client.mutate({
        mutation: updateLegalContents,
        variables: {
          ...variables
        }
      })
    )
];

export const save = createSave('administration.legalContents.successSave');