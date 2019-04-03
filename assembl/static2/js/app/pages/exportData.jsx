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
  end: ?moment
};

class ExportData extends React.Component<Props, State> {
  state = {
    exportLocale: '',
    shouldTranslate: false,
    shouldBeAnonymous: false,
    start: null,
    end: null
  };

  handleDatesChange = ({ startDate, endDate }: DateRange) => this.setState({ start: startDate, end: endDate });

  handleShouldTranslate = (shouldTranslate: boolean) => {
    this.setState({ shouldTranslate: shouldTranslate });
  };

  toggleAnonymousOption = () => {
    this.setState(prevState => ({ shouldBeAnonymous: !prevState.shouldBeAnonymous }));
  };

  handleExportLocaleChange = (exportLocale: string) => {
    this.setState({
      exportLocale: exportLocale
    });
  };

  render() {
    const { section, languages, phases } = this.props;
    const { exportLocale, shouldBeAnonymous, shouldTranslate, start, end } = this.state;
    const locale = exportLocale || (languages && languages[0].locale);
    const translation = shouldTranslate && locale ? locale : '';
    const anonymous = `${shouldBeAnonymous.toString()}`;
    const debateId = getDiscussionId();
    const startDate = start ? start.format('L') : '';
    const endDate = end ? end.format('L') : '';
    const exportDataLink = get(
      'exportDebateData',
      { debateId: debateId },
      { translation: translation, anonymous: anonymous, startDate: startDate, endDate: endDate }
    );
    const exportTaxonomiesLink = get('exportTaxonomiesData', { debateId: debateId });
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
          />
        )}
        {section === '2' && (
          <ExportSection sectionTitle="taxonomySectionTitle" annotation="taxonomyAnnotation" exportLink={exportTaxonomiesLink} />
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
)(ExportData);