// @flow
import type { FileValue, I18nValue, I18nRichTextValue } from '../../form/types.flow';

type ThemeValue = {
  id: string,
  img: FileValue,
  title: I18nValue,
  description: I18nValue,
  identifier: string,
  announcement: {
    title: I18nValue,
    body: I18nRichTextValue
  }
};

export type ThemesValue = Array<ThemeValue>;

export type BrightMirrorAdminValues = {
  themes: ThemesValue
};