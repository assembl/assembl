// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { compose, graphql } from 'react-apollo';
import { FormGroup, Radio, FormControl } from 'react-bootstrap';
import withLoadingIndicator from '../../components/common/withLoadingIndicator';


import { getDiscussionId } from '../../utils/globalFunctions';
import SectionTitle from './sectionTitle';
import DiscussionPreferenceLanguage from '../../graphql/DiscussionPreferenceLanguage.graphql';

type Props = {
  languages?: Array<Object>,
  exportType: string,
  voteSessionId?: string
};

type State = {
  exportLocale: ?string,
  translate: boolean
};

class DumbExportSection extends React.Component<Object, Props, State> {
  props: Props;

  state: State;

  static defaultProps = {
    languages: null,
    voteSessionId: null
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

  constructor(props: Props) {
    super(props);
    this.state = {
      exportLocale: null,
      translate: false
    };
  }


  selectExportLocale = (locale: string) => {
    this.setState({ exportLocale: locale });
  };

  toggleTranslation = (shouldTranslate: boolean) => {
    this.setState({ translate: shouldTranslate });
  };

  render() {
    const { languages, exportType, voteSessionId } = this.props;
    const isSurveyExport = exportType === 'survey';
    const { translate } = this.state;
    const debateId = getDiscussionId();
    if (!debateId) return null;
    const exportLocale = this.state.exportLocale || languages && languages[0].locale;
    let exportLink;
    if (isSurveyExport) { exportLink = `/data/Discussion/${debateId}/phase1_csv_export${translate ? `?lang=${exportLocale}` : ''}`; } else {
      exportLink = `/data/Discussion/${debateId}/widgets/${voteSessionId}/vote_results_csv`;
    }
    return (
      <div className="admin-box survey-admin-export-section">
        <SectionTitle title={I18n.t('administration.survey.2')} annotation={I18n.t('administration.surveyExport.annotation')} />
        <div className="admin-content">
          {isSurveyExport && <FormGroup>
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
                <DumbExportSection.ExportLanguageDropDown
                  languages={languages}
                  onSelect={this.selectExportLocale}
                  activeKey={exportLocale}
                />
              )}
            </Radio>
          </FormGroup>}

          <br />
          <Link className="button-link button-dark margin-l" href={exportLink}>
            <Translate value="administration.surveyExport.link" />
          </Link>
        </div>
      </div>
    );
  }
}

export { DumbExportSection };

const mapStateToProps = ({ i18n, admin }) => ({
  i18n: i18n,
  voteSessionId: admin.voteSession.page.toJS().id
});

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionPreferenceLanguage, {
    options: ({ i18n: { locale } }) => ({
      variables: {
        inLocale: locale
      }
    }),
    props: ({ data }) => {
      if (data.loading) {
        return {
          loading: true
        };
      }

      if (data.error) {
        return {
          hasErrors: true,
          loading: false
        };
      }
      return {
        hasErrors: false,
        languages: data.discussionPreferences.languages };
    } }),
  withLoadingIndicator()
)(DumbExportSection);