// @flow

import { I18n } from 'react-redux-i18n';
import type { DatePickerValue, DatePickerValidation } from './types.flow';

export const validStartDate = (startDate: ?moment$Moment, endDate: ?moment$Moment): boolean => {
  if (!startDate || !endDate) {
    return true;
  }
  return startDate.isSameOrBefore(endDate);
};

export const validEndDate = (startDate: ?moment$Moment, endDate: ?moment$Moment): boolean => {
  if (!startDate || !endDate) {
    return true;
  }
  return endDate.isSameOrAfter(startDate);
};

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