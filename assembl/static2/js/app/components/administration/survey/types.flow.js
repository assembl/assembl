// @flow
import type { FileValue, I18nValue, I18nRichTextValue } from '../../form/types.flow';
import { type Option } from '../../form/selectFieldAdapter';

type QuestionValue = {
  id: string,
  title: I18nValue
};

export type MediaValue = {|
  htmlCode: string,
  img: FileValue
|};

type VideoValue = {
  media: ?MediaValue,
  title: I18nValue,
  descriptionBottom: I18nRichTextValue,
  descriptionSide: I18nRichTextValue,
  descriptionTop: I18nRichTextValue,
  present?: string
};

export type ThemeValue = {
  id: string,
  messageViewOverride: ?Option,
  img: FileValue,
  questions: Array<QuestionValue>,
  title: I18nValue,
  video: VideoValue,
  children: Array<ThemeValue>
};

export type ThemesValue = Array<ThemeValue>;

export type SurveyAdminValues = {
  themes: ThemesValue
};