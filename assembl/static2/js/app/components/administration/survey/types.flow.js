// @flow
import type { FileValue, I18nValue, I18nRichTextValue } from '../../form/types.flow';
import { type Option } from '../../form/selectFieldAdapter';

type QuestionValue = {
  id: string,
  title: I18nValue
};

type QuestionValueFromQuery = {
  id: string,
  titleEntries: LangstringEntries
};

export type ThemeValue = {
  id: string,
  messageViewOverride: Option,
  img: ?FileValue,
  title: I18nValue,
  description: I18nValue,
  announcement: {
    title: I18nValue,
    body: I18nRichTextValue,
    quote: I18nRichTextValue
  },
  questions: Array<QuestionValue>,
  children: Array<ThemeValue>,
  order: number
};

export type ThemeValueFromQuery = {
  id: string,
  messageViewOverride: ?string,
  img: ?FileValue,
  titleEntries: LangstringEntries,
  descriptionEntries: LangstringEntries,
  announcement: ?{
    titleEntries: LangstringEntries,
    bodyEntries: LangstringEntries,
    quoteEntries: LangstringEntries
  },
  questions: Array<QuestionValueFromQuery>,
  children: Array<ThemeValueFromQuery>,
  order: number
};

export type ThemesValue = Array<ThemeValue>;

export type ThemesAdminValues = {
  themes: ThemesValue
};