// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { FormGroup, Radio, FormControl } from 'react-bootstrap';
import SectionTitle from './sectionTitle';

type Props = {
  languages?: Array<Object>,
  handleTranslationChange: Function,
  handleExportLocaleChange: Function,
  withLanguageOptions?: boolean,
  exportLink: string,
  exportLocale?: string,
  translate?: boolean
};

class ExportSection extends React.Component<Object, Props, void> {
  props: Props;

  static defaultProps = {
    languages: null,
    withLanguageOptions: false,
    exportLocale: null,
    translate: false
  };

  static ExportLanguageDropDown = ({ languages, onSelect, activeKey }) => {
    const activeLanguage = languages.filter(language => language.locale === activeKey)[0];
    return (
      <FormControl
        className="export-language-dropdown"
        componentClass="select"
        onChange={({ target: { value } }) => {
          onSelect(value);
        }}
        value={activeLanguage.locale}
      >
        {languages.map(lang => (
          <option key={`locale-${lang.locale}`} value={lang.locale}>
            {lang.name}
          </option>
        ))}
      </FormControl>
    );
  };

  selectExportLocale = (locale: string) => {
    this.props.handleExportLocaleChange(locale);
  };

  toggleTranslation = (shouldTranslate: boolean) => {
    this.props.handleTranslationChange(shouldTranslate);
  };

  render() {
    const {
      languages,
      handleTranslationChange,
      handleExportLocaleChange,
      withLanguageOptions,
      exportLink,
      translate,
      exportLocale
    } = this.props;
    return (
      <div className="admin-box survey-admin-export-section">
        <SectionTitle title={I18n.t('administration.survey.2')} annotation={I18n.t('administration.surveyExport.annotation')} />
        <div className="admin-content">
          {withLanguageOptions && (
            <FormGroup>
              <Radio
                checked={!translate}
                onChange={() => {
                  handleTranslationChange(false);
                }}
              >
                <Translate value="administration.surveyExport.noExportLanguage" />
              </Radio>
              <Radio
                checked={translate}
                onChange={() => {
                  handleTranslationChange(true);
                }}
              >
                <Translate value="administration.surveyExport.translateTheMessagesIn" />
                {translate && (
                  <ExportSection.ExportLanguageDropDown
                    languages={languages}
                    onSelect={handleExportLocaleChange}
                    activeKey={exportLocale}
                  />
                )}
              </Radio>
            </FormGroup>
          )}

          <br />
          <Link className="button-link button-dark margin-l" href={exportLink}>
            <Translate value="administration.surveyExport.link" />
          </Link>
        </div>
      </div>
    );
  }
}

export default ExportSection;