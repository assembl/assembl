// @flow
import type { TextMultimediaValue } from './types.flow';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText } from '../../../form/utils';

// TODO replace the mock by the query
const mockDataFromQuery = {
  titleEntries: [
    { value: 'Titre de la section text et multimedia', localeCode: 'fr' },
    { value: 'Text and multimedia title', localeCode: 'en' }
  ],
  layout: 1,
  bodyEntries: [
    { value: '<p>Body de la section text et multimedia</p>', localeCode: 'fr' },
    { value: '<p>Text and multimedia body</p>', localeCode: 'en' }
  ]
};

export const load = () => mockDataFromQuery;

export function postLoadFormat(): TextMultimediaValue {
  return {
    title: convertEntriesToI18nValue(mockDataFromQuery.titleEntries),
    layout: mockDataFromQuery.layout,
    body: convertEntriesToI18nRichText(mockDataFromQuery.bodyEntries),
    // TODO add the I18n in the label
    layoutOptions: [
      { label: '1 zone', isChecked: mockDataFromQuery.layout === 1 },
      { label: '2 zones', isChecked: mockDataFromQuery.layout === 2 },
      { label: '2 zones', isChecked: mockDataFromQuery.layout === 3 },
      { label: '3 zones', isChecked: mockDataFromQuery.layout === 4 },
      { label: '4 zones', isChecked: mockDataFromQuery.layout === 5 },
      { label: '3 zones', isChecked: mockDataFromQuery.layout === 6 }
    ]
  };
}