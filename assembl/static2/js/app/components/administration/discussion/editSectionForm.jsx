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
  moveSectionUp,
  moveSectionDown
} from '../../../actions/adminActions/adminSections';

type EditSectionFormProps = {
  url: string,
  type: string,
  title: string,
  nbSections: number,
  index: number,
  handleTitleChange: Function,
  handleUrlChange: Function,
  toggleExternalPageField: Function,
  handleDeleteClick: Function,
  handleDownClick: Function,
  handleUpClick: Function
};

const DumbEditSectionForm = ({
  url,
  type,
  title,
  nbSections,
  index,
  handleTitleChange,
  toggleExternalPageField,
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
          <Checkbox checked={hasUrl} onChange={toggleExternalPageField}>
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
  const section = state.admin.sections.sectionsById.get(id);
  return {
    url: section.get('url'),
    type: section.get('type'),
    order: section.get('order'),
    title: getEntryValueForLocale(section.get('titleEntries'), locale, '')
  };
};

const mapDispatchToProps = (dispatch, { id, locale }) => ({
  handleTitleChange: e => dispatch(updateSectionTitle(id, locale, e.target.value)),
  handleUrlChange: e => dispatch(updateSectionUrl(id, e.target.value)),
  toggleExternalPageField: () => dispatch(toggleExternalPage(id)),
  handleDeleteClick: () => dispatch(deleteSection(id)),
  handleUpClick: () => dispatch(moveSectionUp(id)),
  handleDownClick: () => dispatch(moveSectionDown(id))
});

export { DumbEditSectionForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbEditSectionForm);