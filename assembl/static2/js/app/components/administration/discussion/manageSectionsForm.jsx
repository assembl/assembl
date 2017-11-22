// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import EditSectionForm from './editSectionForm';
import { addSectionTooltip } from '../../common/tooltips';

const ManageSectionsForm = ({ sections, selectedLocale }) => {
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.sectionsTitle')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <form>
          {sections.map((id) => {
            return <EditSectionForm key={id} id={id} locale={selectedLocale} />;
          })}
          <OverlayTrigger placement="top" overlay={addSectionTooltip}>
            <div className="plus margin-l">+</div>
          </OverlayTrigger>
        </form>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { sectionsInOrder, sectionsById } = state.admin.sections;
  return {
    selectedLocale: state.admin.selectedLocale,
    sections: sectionsInOrder.filter((id) => {
      return !sectionsById.get(id).get('toDelete');
    })
  };
};

export default connect(mapStateToProps)(ManageSectionsForm);