import React from 'react';
import { connect } from 'react-redux';
import { get } from '../utils/routeMap';

import ExportSection from '../components/administration/exportSection';

const ExportTaxonomies = ({ debateId }) => {
  const exportLink = get('exportTaxonomiesData', { debateId: debateId });
  return <ExportSection sectionTitle="taxonomySectionTitle" annotation="taxonomyAnnotation" exportLink={exportLink} />;
};

const mapStateToProps = ({ context }) => ({
  debateId: context.debateId
});

export default connect(mapStateToProps)(ExportTaxonomies);