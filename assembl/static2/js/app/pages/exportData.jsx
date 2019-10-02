// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import moment from 'moment';
import { connect } from 'react-redux';
import ExportSection from '../components/administration/exportSection';
import { get } from '../utils/routeMap';
import { getDiscussionId } from '../utils/globalFunctions';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';

import DiscussionPreferences from '../graphql/DiscussionPreferences.graphql';
import { PublicationStates } from '../constants';

type Props = {
  section: string,
  locale: string,
  languages: Array<Language>,
  phases: Timeline
};

type State = {
  shouldTranslate: boolean,
  exportLocale: string,
  shouldBeAnonymous: boolean,
  start: ?moment,
  end: ?moment,
  buttonIsDisabled: boolean
};

export class DumbExportData extends React.Component<Props, State> {
  state = {
    exportLocale: '',
    shouldTranslate: false,
    shouldBeAnonymous: false,
    start: null,
    end: null,
    buttonIsDisabled: false
  };

  handleDatesChange = ({ startDate, endDate }: DateRange) => {
    this.enableExportButton();
    this.setState({ start: startDate, end: endDate });
  };

  handleShouldTranslate = (shouldTranslate: boolean) => {
    this.enableExportButton();
    this.setState({ shouldTranslate: shouldTranslate });
  };

  toggleAnonymousOption = () => {
    this.enableExportButton();
    this.setState(prevState => ({ shouldBeAnonymous: !prevState.shouldBeAnonymous }));
  };

  handleExportLocaleChange = (exportLocale: string) => {
    this.enableExportButton();
    this.setState({
      exportLocale: exportLocale
    });
  };

  disableExportButton = () => {
    this.setState({ buttonIsDisabled: true });
  };

  enableExportButton = () => {
    this.setState({ buttonIsDisabled: false });
  };

  render() {
    const { section, languages, phases } = this.props;
    const { exportLocale, shouldBeAnonymous, shouldTranslate, start, end, buttonIsDisabled } = this.state;
    const locale = exportLocale || (languages && languages[0].locale);
    const translation = shouldTranslate && locale ? locale : '';
    const anonymous = `${shouldBeAnonymous.toString()}`;
    const debateId = getDiscussionId();
    const startDate = start ? start.toISOString() : '';
    const endDate = end ? end.toISOString() : '';
    const exportDataLink = get(
      'exportDebateData',
      { debateId: debateId },
      { lang: translation, anon: anonymous, start: startDate, end: endDate }
    );
    const exportModeratedDataLink = get(
      'exportDebatePosts',
      { debateId: debateId },
      {
        lang: translation,
        anon: anonymous,
        start: startDate,
        end: endDate,
        publicationStates: [
          PublicationStates.DELETED_BY_ADMIN,
          PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE,
          PublicationStates.MODERATED_TEXT_ON_DEMAND
        ].join(',')
      }
    );

    const exportTaxonomiesLink = get('exportTaxonomiesData', { debateId: debateId });
    const exportUsersLink = get('exportUsersData', { debateId: debateId }, { anon: anonymous, start: startDate, end: endDate });
    return (
      <div>
        {section === '1' && (
          <ExportSection
            annotation="contributions"
            sectionTitle="contributions"
            handleDatesChange={this.handleDatesChange}
            handleAnonymousChange={this.toggleAnonymousOption}
            handleShouldTranslate={this.handleShouldTranslate}
            handleExportLocaleChange={this.handleExportLocaleChange}
            locale={locale}
            shouldBeAnonymous={shouldBeAnonymous}
            shouldTranslate={shouldTranslate}
            exportLocale={exportLocale}
            exportLink={exportDataLink}
            phases={phases}
            start={start}
            end={end}
            languages={languages}
            disableExportButton={this.disableExportButton}
            buttonIsDisabled={buttonIsDisabled}
          />
        )}
        {section === '2' && (
          <ExportSection
            sectionTitle="taxonomySectionTitle"
            annotation="taxonomyAnnotation"
            exportLink={exportTaxonomiesLink}
            disableExportButton={this.disableExportButton}
            buttonIsDisabled={buttonIsDisabled}
          />
        )}
        {section === '3' && (
          <ExportSection
            sectionTitle="usersSectionTitle"
            annotation="usersAnnotation"
            handleDatesChange={this.handleDatesChange}
            handleAnonymousChange={this.toggleAnonymousOption}
            locale={locale}
            shouldBeAnonymous={shouldBeAnonymous}
            shouldTranslate={shouldTranslate}
            exportLink={exportUsersLink}
            phases={phases}
            start={start}
            end={end}
            languages={languages}
            disableExportButton={this.disableExportButton}
            buttonIsDisabled={buttonIsDisabled}
          />
        )}
        {section === '4' && (
          <ExportSection
            annotation="moderatedContributionsAnnotation"
            sectionTitle="moderatedContributions"
            handleDatesChange={this.handleDatesChange}
            handleAnonymousChange={this.toggleAnonymousOption}
            handleShouldTranslate={this.handleShouldTranslate}
            handleExportLocaleChange={this.handleExportLocaleChange}
            locale={locale}
            shouldBeAnonymous={shouldBeAnonymous}
            shouldTranslate={shouldTranslate}
            exportLocale={exportLocale}
            exportLink={exportModeratedDataLink}
            phases={phases}
            start={start}
            end={end}
            languages={languages}
            disableExportButton={this.disableExportButton}
            buttonIsDisabled={buttonIsDisabled}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({ timeline, i18n }) => ({
  phases: timeline,
  locale: i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionPreferences, {
    options: ({ locale }) => ({
      variables: {
        inLocale: locale
      }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        languages: data.discussionPreferences.languages
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbExportData);