// @flow
import { I18n } from 'react-redux-i18n';
import { i18nValueIsEmpty } from '../../../form/utils';
import { validStartDate, validEndDate } from '../../landingPage/header/validate';
import type { PhaseValue, PhasesValues } from './type.flow';

type Errors = {
  start?: string,
  end?: string
};

const validatePhase = (phase: PhaseValue): Errors => ({
  title: i18nValueIsEmpty(phase.title) ? I18n.t('error.required') : undefined,
  start: validStartDate(phase.start.time, phase.end.time)
    ? undefined
    : I18n.t('administration.landingPage.header.startDateError'),
  end: validEndDate(phase.start.time, phase.end.time) ? undefined : I18n.t('administration.landingPage.header.endDateError')
});

export default function validate(values: PhasesValues): { phases: Array<Errors> } {
  const phases = values.phases.map(validatePhase);
  return {
    phases: phases
  };
}