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

type ColumnSynthesisValueFromQuery = {
  subjectEntries: LangstringEntries,
  bodyEntries: LangstringEntries
};

type ColumnSynthesisValue = {
  subject: I18nValue,
  body: I18nRichTextValue
};

type MessageColumnValue = {
  messageClassifier: string,
  title: I18nValue,
  name: I18nValue,
  color: string,
  columnSynthesis: ColumnSynthesisValue
};

type RadioButtonValue = {
  label: string,
  isChecked: boolean,
  size: number
};

type MultiColumnsValue = {
  radioButtons: Array<RadioButtonValue>,
  messageColumns: Array<MessageColumnValue>
};

type MessageColumnValueFromQuery = {
  nameEntries: LangstringEntries,
  titleEntries: LangstringEntries,
  color: string,
  messageClassifier: string,
  columnSynthesis: ColumnSynthesisValueFromQuery
};

export type ThemeValue = {
  id: string,
  messageViewOverride: Option,
  numPosts: number,
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
  order: number,
  multiColumns: MultiColumnsValue
};

export type ThemeValueFromQuery = {
  id: string,
  messageViewOverride: ?string,
  numPosts: number,
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
  order: number,
  messageColumns: Array<MessageColumnValueFromQuery>
};

export type ThemesValue = Array<ThemeValue>;

export type ThemesAdminValues = {
  themes: ThemesValue
};