// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import EditSectionForm from './editSectionForm';
import { addSectionTooltip } from '../../common/tooltips';
import * as actions from '../../../actions/adminActions/adminSections';

const ManageSectionsForm = ({ sections, selectedLocale, createSection }) => {
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.sectionsTitle')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <form>
          {sections.map((id, index) => {
            return <EditSectionForm key={id} id={id} index={index} locale={selectedLocale} nbSections={sections.size} />;
          })}
          <OverlayTrigger placement="top" overlay={addSectionTooltip}>
            <div
              onClick={() => {
                return createSection(sections.size);
              }}
              className="plus margin-l"
            >
              +
            </div>
          </OverlayTrigger>
        </form>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { sectionsInOrder, sectionsById } = state.admin.sections;
  const filteredSections = sectionsInOrder.filter((id) => {
    return !sectionsById.get(id).get('toDelete') && sectionsById.get(id).get('type') !== 'ADMINISTRATION';
  });
  return {
    selectedLocale: state.admin.selectedLocale,
    sections: filteredSections.sort((a, b) => {
      const aOrder = sectionsById.get(a).get('order');
      const bOrder = sectionsById.get(b).get('order');
      return aOrder - bOrder;
    })
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createSection: (nextOrder) => {
      const newId = Math.round(Math.random() * -1000000).toString();
      return dispatch(actions.createSection(newId, nextOrder));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageSectionsForm);