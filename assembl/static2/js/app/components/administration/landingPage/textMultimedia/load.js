// @flow
import type { TextMultimediaValue } from './types.flow';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText } from '../../../form/utils';

const mockData = {
  titleEntries: [
    { value: 'Titre de la section text et multimedia', localeCode: 'fr' },
    { value: 'Text and multimedia title', localeCode: 'en' }
  ],
  bodyEntries: [
    { value: '<p>Body de la section text et multimedia</p>', localeCode: 'fr' },
    { value: '<p>Text and multimedia body</p>', localeCode: 'en' }
  ]
};

export const load = () => mockData;

export function postLoadFormat(): TextMultimediaValue {
  return {
    title: convertEntriesToI18nValue(mockData.titleEntries),
    body: convertEntriesToI18nRichText(mockData.bodyEntries)
  };
}