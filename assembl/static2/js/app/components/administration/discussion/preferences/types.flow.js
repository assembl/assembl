// @flow

export type LocalePreference = {
  locale: string,
  localeName: string,
  isChecked: boolean
};

export type LanguagePreferencesFormValues = {
  languages: Array<LocalePreference>
};