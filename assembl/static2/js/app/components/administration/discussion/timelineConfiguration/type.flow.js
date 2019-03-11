// @flow
import type { FileValue, I18nValue, DatePickerInput } from '../../../form/types.flow';

export type PhaseValueFromQuery = {
  title: I18nValue,
  titleEntries: LangstringEntries,
  descriptionEntries: LangstringEntries,
  description: I18nValue,
  image: FileValue,
  id: string,
  identifier: string,
  start: string,
  end: string,
  order: number
};

export type PhasesValuesFromQuery = {
  timeline: Array<PhaseValueFromQuery>
};

export type PhaseValue = {
  title: I18nValue,
  description: I18nValue,
  image: FileValue,
  id: string,
  identifier: string,
  start: DatePickerInput,
  end: DatePickerInput,
  order: number
};

export type PhasesValues = {
  phases: Array<PhaseValue>
};