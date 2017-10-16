import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { compose, graphql } from 'react-apollo';
import { NavDropdown, MenuItem } from 'react-bootstrap';

import { getDiscussionId } from '../../../utils/globalFunctions';
import SectionTitle from '../sectionTitle';
import DiscussionPreferenceLanguage from '../../../graphql/DiscussionPreferenceLanguage.graphql';

class ExportSection extends React.Component {
  static NO_EXPORT_LOCALE = 'none';
  static ExportLanguageDropDown = ({ languages, onSelect, activeKey }) => {
    const activeLanguage = languages.filter((language) => {
      return language.locale === activeKey;
    })[0];
    const noTranslation = I18n.t('administration.surveyExport.noExportLanguage');
    const activeLanguageString = activeLanguage
      ? `${I18n.t('administration.surveyExport.willBeTranslatedIn', { language: activeLanguage.name })}`
      : noTranslation;
    return (
      <section>
        <ul className="dropdown-xl">
          <NavDropdown
            title={I18n.t('administration.surveyExport.chooseExportLanguage')}
            id="nav-dropdown-xl"
            onSelect={onSelect}
            activeKey={activeKey}
          >
            <MenuItem eventKey={ExportSection.NO_EXPORT_LOCALE}>
              {noTranslation}
            </MenuItem>
            <MenuItem divider />
            {languages.map(({ locale, name }) => {
              return (
                <MenuItem key={locale} eventKey={locale}>
                  {name}
                </MenuItem>
              );
            })}
          </NavDropdown>
        </ul>
        <p className="active-language">
          {activeLanguageString}
        </p>
      </section>
    );
  };
  state = { exportLocale: ExportSection.NO_EXPORT_LOCALE };
  componentWillMount() {
    const { toggleLanguageMenu } = this.props;
    toggleLanguageMenu(false);
  }
  selectExportLocale = (locale) => {
    this.setState({ exportLocale: locale });
  };
  render() {
    const { i18n, data: { discussionPreferences: { languages } } } = this.props;
    const { exportLocale } = this.state;
    const debateId = getDiscussionId();
    const exportLink = `/data/Discussion/${debateId}/phase1_csv_export?lang=${exportLocale}`;
    return (
      <div className="admin-box">
        <SectionTitle i18n={i18n} phase="survey" tabId="2" annotation={I18n.t('administration.surveyExport.annotation')} />
        <div className="admin-content">
          <ExportSection.ExportLanguageDropDown
            languages={languages}
            onSelect={this.selectExportLocale}
            activeKey={exportLocale}
          />
          <Link className="button-link button-dark margin-l" href={exportLink}>
            <Translate value="administration.surveyExport.link" />
          </Link>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ i18n }) => {
  return {
    i18n: i18n
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionPreferenceLanguage, {
    options: ({ i18n: { locale } }) => {
      return {
        variables: {
          inLocale: locale
        }
      };
    }
  })
)(ExportSection);