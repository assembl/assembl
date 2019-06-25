// @flow
import { type CheckboxListValue } from '../../../form/types.flow';

export type DiscussionPreferencesFormValues = {
  languages: CheckboxListValue,
  withModeration: boolean,
  withTranslation: Boolean,
  withSemanticAnalysis: Boolean,
  slug: string
};