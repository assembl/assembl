// @flow
import { I18n } from 'react-redux-i18n';
import { i18nValueIsEmpty } from '../../../form/utils';
import { validStartDate, validEndDate } from '../../landingPage/header/validate';
import type { PhaseValue, PhasesValues } from './type.flow';

type Errors = {
  start?: string,
  end?: string
};

const validatePhase = (phase: PhaseValue): Errors => {
  const errors = {
    title: i18nValueIsEmpty(phase.title) ? I18n.t('error.required') : undefined,
    start: undefined,
    end: undefined
  };
  if (!phase.start || !phase.start.time) {
    errors.start = I18n.t('error.required');
  } else if (phase.start && phase.start.time && phase.end && phase.end.time) {
    errors.start = validStartDate(phase.start.time, phase.end.time)
      ? undefined
      : I18n.t('administration.landingPage.header.startDateError');
  }
  if (!phase.end || !phase.end.time) {
    errors.end = I18n.t('error.required');
  } else if (phase.start && phase.start.time && phase.end && phase.end.time) {
    errors.end = validEndDate(phase.start.time, phase.end.time)
      ? undefined
      : I18n.t('administration.landingPage.header.endDateError');
  }
  return errors;
};

export default function validate(values: PhasesValues): { phases: Array<Errors> } {
  const phases = values.phases.map(validatePhase);
  return {
    phases: phases
  };
}