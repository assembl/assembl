// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { compose, graphql } from 'react-apollo';
import { FormGroup, Radio, FormControl } from 'react-bootstrap';

import { getDiscussionId } from '../../../utils/globalFunctions';
import SectionTitle from '../sectionTitle';
import DiscussionPreferenceLanguage from '../../../graphql/DiscussionPreferenceLanguage.graphql';

class ExportSection extends React.Component {
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

  state = { exportLocale: null, translate: false };

  componentWillMount() {
    const { toggleLanguageMenu } = this.props;
    toggleLanguageMenu(false);
  }

  selectExportLocale = (locale) => {
    this.setState({ exportLocale: locale });
  };

  toggleTranslation = (shouldTranslate) => {
    this.setState({ translate: shouldTranslate });
  };

  render() {
    const { data: { discussionPreferences: { languages } } } = this.props;
    const { translate } = this.state;
    const debateId = getDiscussionId();
    if (!debateId) return null;
    const exportLocale = this.state.exportLocale || languages[0].locale;
    const exportLink = `/data/Discussion/${debateId}/phase1_csv_export${translate ? `?lang=${exportLocale}` : ''}`;
    return (
      <div className="admin-box survey-admin-export-section">
        <SectionTitle title={I18n.t('administration.survey.2')} annotation={I18n.t('administration.surveyExport.annotation')} />
        <div className="admin-content">
          <FormGroup>
            <Radio
              checked={!translate}
              onChange={() => {
                this.toggleTranslation(false);
              }}
            >
              <Translate value="administration.surveyExport.noExportLanguage" />
            </Radio>
            <Radio
              checked={translate}
              onChange={() => {
                this.toggleTranslation(true);
              }}
            >
              <Translate value="administration.surveyExport.translateTheMessagesIn" />
              {translate && (
                <ExportSection.ExportLanguageDropDown
                  languages={languages}
                  onSelect={this.selectExportLocale}
                  activeKey={exportLocale}
                />
              )}
            </Radio>
          </FormGroup>
          <br />
          <Link className="button-link button-dark margin-l" href={exportLink}>
            <Translate value="administration.surveyExport.link" />
          </Link>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ i18n }) => ({
  i18n: i18n
});

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionPreferenceLanguage, {
    options: ({ i18n: { locale } }) => ({
      variables: {
        inLocale: locale
      }
    })
  })
)(ExportSection);