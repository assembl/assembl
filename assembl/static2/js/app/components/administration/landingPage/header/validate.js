// @flow

import { I18n } from 'react-redux-i18n';
import { type DateTime } from '../../../form/types.flow';
import type { DatePickerValue, DatePickerValidation } from './types.flow';

export const validStartDate = (startDate: DateTime, endDate: DateTime): boolean => startDate <= endDate;

export const validEndDate = (startDate: DateTime, endDate: DateTime): boolean => endDate >= startDate;

export const validateDatePicker = (values: DatePickerValue): DatePickerValidation => ({
  headerTitle: undefined,
  headerSubtitle: undefined,
  headerButtonLabel: undefined,
  headerImage: undefined,
  headerLogoImage: undefined,
  headerStartDate: validStartDate(values.headerStartDate.time, values.headerEndDate.time)
    ? undefined
    : I18n.t('administration.landingPage.header.startDateError'),
  headerEndDate: validEndDate(values.headerStartDate.time, values.headerEndDate.time)
    ? undefined
    : I18n.t('administration.landingPage.header.endDateError')
});