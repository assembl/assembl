import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, Checkbox } from 'react-bootstrap';
import FormControlWithLabel from '../../common/formControlWithLabel';

import sectionsMock from '../../common/sectionsMock';

const SectionForm = ({ i18n }) => {
  const { locale, translations } = i18n;
  const titlePh = I18n.t('administration.sections.titlePh');
  const urlPh = I18n.t('administration.sections.urlPh');

  const handleTitleChange = () => {};

  const handleCheckboxChange = () => {};

  const handleUrlChange = () => {};

  return (
    <div className="form-container">
      {sectionsMock.map((section) => {
        return (
          <div key={section.id}>
            <div className="title">
              {translations[locale].administration.sections[section.type.toLowerCase()]
                ? translations[locale].administration.sections[section.type.toLowerCase()]
                : I18n.t('administration.sections.custom')}
            </div>
            <FormControlWithLabel label={titlePh} onChange={handleTitleChange} type="text" value={section.title} />
            {section.type === 'HOMEPAGE' ? (
              <FormGroup>
                <Checkbox checked={section.url} onChange={handleCheckboxChange}>
                  <Translate value="administration.sections.externalPage" />
                </Checkbox>
              </FormGroup>
            ) : null}
            {(section.type === 'HOMEPAGE' && section.url) || section.type === 'CUSTOM' ? (
              <FormControlWithLabel label={urlPh} onChange={handleUrlChange} type="text" value={section.url} />
            ) : null}
            <div className="separator" />
          </div>
        );
      })}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(SectionForm);