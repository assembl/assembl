// @flow

import type { I18nRichTextValue, I18nValue } from '../../../form/types.flow';

export type TextMultimediaValues = {
  textMultimediaTitle: I18nValue,
  textMultimediaBody: I18nRichTextValue
};

export type MultilingualTextMultimedia = {
  // The ID of the object.
  id: string,
  // A list of possible languages of the entity as LangStringEntry objects. The title in various languages.
  textMultimediaTitleEntries: LangstringEntries,
  // A list of possible languages of the entity as LangStringEntry objects. The body in various languages.
  textMultimediaBodyEntries: LangstringEntries
};