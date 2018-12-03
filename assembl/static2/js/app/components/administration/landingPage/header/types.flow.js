// @flow

import type { FileValue, I18nValue, I18nRichTextValue, DateTime } from '../../../form/types.flow';

export type DatePickerValue = {
  headerTitle: I18nValue,
  headerSubtitle: I18nRichTextValue,
  headerButtonLabel: I18nValue,
  headerImage: FileValue,
  headerLogoImage: FileValue,
  headerStartDate: DateTime,
  headerEndDate: DateTime
};
