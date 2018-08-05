// @flow
import type { FileValue, I18nValue } from '../../form/types.flow';

export type ResourceValue = {
  doc: FileValue,
  embedCode: string,
  id: string,
  img: FileValue,
  title: I18nValue,
  text: I18nValue
};

export type ResourcesValues = {
  pageTitle: I18nValue,
  pageHeader: FileValue,
  resources: Array<ResourceValue>
};