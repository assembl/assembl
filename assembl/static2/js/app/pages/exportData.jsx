// @flow
import React from 'react';
import ExportSection from '../components/administration/exportSection';
import ExportTaxonomies from './exportTaxonomies';

type Props = {
  section: string
};

const mockLanguages = [
  { locale: 'fr', name: 'French', nativeName: 'français', __typename: 'LocalePreference' },
  { locale: 'en', name: 'English', nativeName: 'English', __typename: 'LocalePreference' }
];

const ExportData = ({ section }: Props) => (
  <div>
    {section === '1' && (
      <ExportSection
        exportLink=""
        translate
        annotation="contributions"
        sectionTitle="contributions"
        languages={mockLanguages}
        exportLocale="fr"
        withLanguageOptions
      />
    )}
    {section === '2' && <ExportTaxonomies />}
  </div>
);

export default ExportData;