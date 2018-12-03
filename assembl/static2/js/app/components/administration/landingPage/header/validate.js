// @flow

import { I18n } from 'react-redux-i18n';
import { type DateTime } from '../../../form/types.flow';
import { type DatePickerValue } from './types.flow';

export const validStartDate = (startDate: DateTime, endDate: DateTime): boolean => {
  return startDate <= endDate;
};

export const validEndDate = (startDate: DateTime, endDate: DateTime): boolean => {
  return endDate >= startDate;
};

export const validateDatePicker = (values: DatePickerValue): DatePickerValue => ({
  headerTitle: undefined,
  headerSubtitle: undefined,
  headerButtonLabel: undefined,
  headerImage: undefined,
  headerLogoImage: undefined,
  headerStartDate: validStartDate(
    values.headerStartDate.time, values.headerEndDate.time) ? undefined :  I18n.t('administration.landingPage.header.startDateError'),
  headerEndDate: validEndDate(
    values.headerStartDate.time, values.headerEndDate.time) ? undefined :  I18n.t('administration.landingPage.header.endDateError'),
});