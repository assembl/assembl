// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, Checkbox } from 'react-bootstrap';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { updateSectionTitle, updateSectionUrl, toggleExternalPage } from '../../../actions/adminActions/adminSections';

type EditSectionFormProps = {
  handleTitleChange: Function,
  handleUrlChange: Function,
  handleCheckboxChange: Function,
  i18n: Object,
  locale: string,
  url: string,
  type: string,
  title: string
};

const EditSectionForm = ({
  i18n,
  locale,
  url,
  type,
  title,
  handleTitleChange,
  handleCheckboxChange,
  handleUrlChange
}: EditSectionFormProps) => {
  const { translations } = i18n;
  const titlePh = I18n.t('administration.sections.titlePh');
  const urlPh = I18n.t('administration.sections.urlPh');
  const hasUrl = url !== null;
  return (
    <div className="form-container">
      <div>
        <div className="title">
          {translations[locale].administration.sections[type.toLowerCase()]
            ? translations[locale].administration.sections[type.toLowerCase()]
            : I18n.t('administration.sections.custom')}
        </div>
        <FormControlWithLabel label={titlePh} onChange={handleTitleChange} type="text" value={title} />
        {type === 'HOMEPAGE' ? (
          <FormGroup>
            <Checkbox checked={hasUrl} onChange={handleCheckboxChange}>
              <Translate value="administration.sections.externalPage" />
            </Checkbox>
          </FormGroup>
        ) : null}
        {(type === 'HOMEPAGE' && url) || type === 'CUSTOM' ? (
          <FormControlWithLabel label={urlPh} onChange={handleUrlChange} type="text" value={url} />
        ) : null}
        <div className="separator" />
      </div>
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
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditSectionForm);