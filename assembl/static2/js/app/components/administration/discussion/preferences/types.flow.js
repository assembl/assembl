// @flow

export type LocalePreference = {
  locale: string,
  localeName: string,
  isChecked: boolean
};

export type DiscussionPreferencesFormValues = {
  languages: Array<LocalePreference>,
  withModeration: boolean
};