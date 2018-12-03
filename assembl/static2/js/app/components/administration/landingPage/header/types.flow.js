// @flow

import type { FileValue, I18nValue, I18nRichTextValue, DatePickerInput } from '../../../form/types.flow';

export type DatePickerValue = {
  headerTitle: I18nValue,
  headerSubtitle: I18nRichTextValue,
  headerButtonLabel: I18nValue,
  headerImage: FileValue,
  headerLogoImage: FileValue,
  headerStartDate: DatePickerInput,
  headerEndDate: DatePickerInput
};

export type DatePickerValidation = {
  headerTitle: void | string,
  headerSubtitle: void | string,
  headerButtonLabel: void | string,
  headerImage: void | string,
  headerLogoImage: void | string,
  headerStartDate: void | string,
  headerEndDate: void | string
};