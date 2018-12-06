// @flow

type LocalePreference = {
  locale: string,
  name: string,
  isChecked: boolean
};

export type LanguagePreferencesFormValues = {
  languages: Array<LocalePreference>
};