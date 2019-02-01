// @flow
import React from 'react';
import ExportSection from '../components/administration/exportSection';
import ExportTaxonomies from './exportTaxonomies';

type Props = {
  section: string
};

const ExportData = ({ section }: Props) => (
  <div>
    {section === '1' && (
      <ExportSection exportLink="" translate annotation="administration.export.contributions" sectionTitle="contributions" />
    )}
    {section === '2' && <ExportTaxonomies />}
  </div>
);

export default ExportData;