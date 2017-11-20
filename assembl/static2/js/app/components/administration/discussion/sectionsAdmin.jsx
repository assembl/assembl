import React from 'react';
import { I18n } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import SectionForm from './sectionForm';
import { addSectionTooltip } from '../../common/tooltips';

const SectionsAdmin = () => {
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.sectionsTitle')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <form>
          <SectionForm />
          <OverlayTrigger placement="top" overlay={addSectionTooltip}>
            <div className="plus margin-l">+</div>
          </OverlayTrigger>
        </form>
      </div>
    </div>
  );
};

export default SectionsAdmin;