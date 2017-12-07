// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { List } from 'immutable';

import SectionTitle from '../sectionTitle';
import EditSectionForm from './editSectionForm';
import { addSectionTooltip } from '../../common/tooltips';
import * as actions from '../../../actions/adminActions/adminSections';

type ManageSectionFormProps = {
  sections: List<string>,
  selectedLocale: string,
  createSection: Function
};

const DumbManageSectionsForm = ({ sections, selectedLocale, createSection }: ManageSectionFormProps) => (
  <div className="admin-box">
    <SectionTitle title={I18n.t('administration.sections.sectionsTitle')} annotation={I18n.t('administration.annotation')} />
    <div className="admin-content">
      <form>
        {sections.map((id, index) => (
          <EditSectionForm key={id} id={id} index={index} locale={selectedLocale} nbSections={sections.size} />
        ))}
        <OverlayTrigger placement="top" overlay={addSectionTooltip}>
          <div onClick={() => createSection(sections.size)} className="plus margin-l">
            +
          </div>
        </OverlayTrigger>
      </form>
    </div>
  </div>
);

const mapStateToProps = (state) => {
  const { sectionsInOrder } = state.admin.sections;
  return {
    selectedLocale: state.admin.selectedLocale,
    sections: sectionsInOrder
  };
};

const mapDispatchToProps = dispatch => ({
  createSection: (nextOrder) => {
    const newId = Math.round(Math.random() * -1000000).toString();
    return dispatch(actions.createSection(newId, nextOrder));
  }
});

export { DumbManageSectionsForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbManageSectionsForm);