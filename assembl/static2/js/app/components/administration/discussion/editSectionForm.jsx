// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, Checkbox, OverlayTrigger, Button } from 'react-bootstrap';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { deleteSectionTooltip, upTooltip, downTooltip } from '../../common/tooltips';
import {
  updateSectionTitle,
  updateSectionUrl,
  toggleExternalPage,
  deleteSection,
  upSection,
  downSection
} from '../../../actions/adminActions/adminSections';

type EditSectionFormProps = {
  url: string,
  type: string,
  title: string,
  nbSections: number,
  index: number,
  handleTitleChange: Function,
  handleUrlChange: Function,
  handleCheckboxChange: Function,
  handleDeleteClick: Function,
  handleDownClick: Function,
  handleUpClick: Function
};

const EditSectionForm = ({
  url,
  type,
  title,
  nbSections,
  index,
  handleTitleChange,
  handleCheckboxChange,
  handleUrlChange,
  handleDeleteClick,
  handleDownClick,
  handleUpClick
}: EditSectionFormProps) => {
  const titlePh = I18n.t('administration.sections.titlePh');
  const urlPh = I18n.t('administration.sections.urlPh');
  const hasUrl = url !== null;
  return (
    <div className="form-container">
      <div className="title left">
        {`${index + 1}. `}
        {title || I18n.t('administration.sections.custom')}
      </div>
      <div className="right">
        {type !== 'HOMEPAGE' ? (
          <div className="inline">
            {index < nbSections - 1 ? (
              <OverlayTrigger placement="top" overlay={downTooltip}>
                <Button onClick={handleDownClick} className="admin-icons">
                  <span className="assembl-icon-down-bold grey" />
                </Button>
              </OverlayTrigger>
            ) : null}
            {index > 1 ? (
              <OverlayTrigger placement="top" overlay={upTooltip}>
                <Button onClick={handleUpClick} className="admin-icons">
                  <span className="assembl-icon-up-bold grey" />
                </Button>
              </OverlayTrigger>
            ) : null}
          </div>
        ) : null}
        {type === 'CUSTOM' ? (
          <OverlayTrigger placement="top" overlay={deleteSectionTooltip}>
            <Button onClick={handleDeleteClick} className="admin-icons">
              <span className="assembl-icon-delete grey" />
            </Button>
          </OverlayTrigger>
        ) : null}
      </div>
      <div className="clear" />
      {type !== 'HOMEPAGE' ? (
        <FormControlWithLabel label={titlePh} onChange={handleTitleChange} type="text" value={title} />
      ) : null}
      {type === 'HOMEPAGE' ? (
        <FormGroup>
          <Checkbox checked={hasUrl} onChange={handleCheckboxChange}>
            <Translate value="administration.sections.externalPage" />
          </Checkbox>
        </FormGroup>
      ) : null}
      {(type === 'HOMEPAGE' && hasUrl) || type === 'CUSTOM' ? (
        <FormControlWithLabel label={urlPh} onChange={handleUrlChange} type="text" value={url} />
      ) : null}
      <div className="separator" />
    </div>
  );
};

const mapStateToProps = (state, { id, locale }) => {
  const sections = state.admin.sections.sectionsById.get(id);
  return {
    url: sections.get('url'),
    type: sections.get('type'),
    order: sections.get('order'),
    title: getEntryValueForLocale(sections.get('titleEntries'), locale, '')
  };
};

const mapDispatchToProps = (dispatch, { id, locale }) => {
  return {
    handleTitleChange: (e) => {
      return dispatch(updateSectionTitle(id, locale, e.target.value));
    },
    handleUrlChange: (e) => {
      return dispatch(updateSectionUrl(id, e.target.value));
    },
    handleCheckboxChange: () => {
      return dispatch(toggleExternalPage(id));
    },
    handleDeleteClick: () => {
      return dispatch(deleteSection(id));
    },
    handleUpClick: () => {
      return dispatch(upSection(id));
    },
    handleDownClick: () => {
      return dispatch(downSection(id));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditSectionForm);