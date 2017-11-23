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
  handleTitleChange: Function,
  handleUrlChange: Function,
  handleCheckboxChange: Function,
  handleDeleteClick: Function,
  handleDownClick: Function,
  handleUpClick: Function,
  i18n: Object,
  locale: string,
  url: string,
  type: string,
  title: string,
  order: number,
  nbSections: number
};

const EditSectionForm = ({
  i18n,
  locale,
  url,
  type,
  title,
  order,
  nbSections,
  handleTitleChange,
  handleCheckboxChange,
  handleUrlChange,
  handleDeleteClick,
  handleDownClick,
  handleUpClick
}: EditSectionFormProps) => {
  const { translations } = i18n;
  const titlePh = I18n.t('administration.sections.titlePh');
  const urlPh = I18n.t('administration.sections.urlPh');
  const hasUrl = url !== null;
  return (
    <div>
      {type !== 'ADMINISTRATION' ? (
        <div className="form-container">
          <div className="title left">
            {translations[locale].administration.sections[type.toLowerCase()]
              ? translations[locale].administration.sections[type.toLowerCase()]
              : I18n.t('administration.sections.custom')}
          </div>
          <div className="right">
            {type !== 'HOMEPAGE' ? (
              <div className="inline">
                {order < nbSections - 2 ? (
                  <OverlayTrigger placement="top" overlay={downTooltip}>
                    <Button onClick={handleDownClick}>
                      <span className="assembl-icon-down-bold grey" />
                    </Button>
                  </OverlayTrigger>
                ) : null}
                {order > 1 ? (
                  <OverlayTrigger placement="top" overlay={upTooltip}>
                    <Button onClick={handleUpClick}>
                      <span className="assembl-icon-up-bold grey" />
                    </Button>
                  </OverlayTrigger>
                ) : null}
              </div>
            ) : null}
            {type === 'CUSTOM' ? (
              <OverlayTrigger placement="top" overlay={deleteSectionTooltip}>
                <Button onClick={handleDeleteClick}>
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
      ) : null}
    </div>
  );
};

const mapStateToProps = (state, { id, locale }) => {
  const sections = state.admin.sections.sectionsById.get(id);
  return {
    i18n: state.i18n,
    order: sections.get('order'),
    url: sections.get('url'),
    type: sections.get('type'),
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