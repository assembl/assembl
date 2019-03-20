// @flow
import { type CheckboxListValue } from '../../../form/types.flow';

export type DiscussionPreferencesFormValues = {
  languages: CheckboxListValue,
  withModeration: boolean,
  slug: string
};