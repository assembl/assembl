// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, Checkbox } from 'react-bootstrap';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';

type EditSectionFormProps = {
  i18n: Object,
  locale: string,
  url: string,
  type: string,
  title: string
};

const EditSectionForm = ({ i18n, locale, url, type, title }: EditSectionFormProps) => {
  // TODO use order
  const { translations } = i18n;
  const titlePh = I18n.t('administration.sections.titlePh');
  const urlPh = I18n.t('administration.sections.urlPh');

  const handleTitleChange = () => {};

  const handleCheckboxChange = () => {};

  const handleUrlChange = () => {};

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
            <Checkbox checked={url} onChange={handleCheckboxChange}>
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

export default connect(mapStateToProps)(EditSectionForm);