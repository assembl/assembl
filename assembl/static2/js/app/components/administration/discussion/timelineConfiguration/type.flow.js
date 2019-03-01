// @flow

import type { FileValue, I18nValue } from '../../../form/types.flow';

export type PhaseValue = {
  title: I18nValue,
  titleEntries: LangstringEntries,
  descriptionEntries: LangstringEntries,
  description: I18nValue,
  image: FileValue,
  id: string,
  start: string,
  end: string
};

export type PhasesValues = {
  timeline: Array<PhaseValue>
};