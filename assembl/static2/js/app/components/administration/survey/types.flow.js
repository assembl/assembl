// @flow
import type { FileValue, I18nValue, I18nRichTextValue } from '../../form/types.flow';

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
  descriptionTop: I18nRichTextValue
};

export type ThemeValue = {
  id: string,
  img: FileValue,
  questions: Array<QuestionValue>,
  title: I18nValue,
  video: VideoValue,
  children: Array<*>
};

export type ThemesValue = Array<ThemeValue>;

export type SurveyAdminValues = {
  themes: ThemesValue
};