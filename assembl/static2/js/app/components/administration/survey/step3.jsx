// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';

import ExportSection from '../exportSection';
import { get } from '../../../utils/routeMap';
import DiscussionPreferences from '../../../graphql/DiscussionPreferences.graphql';
import manageErrorAndLoading from '../../common/manageErrorAndLoading';

type Language = {
  locale: string
};

type Props = {
  debateId: string,
  languages: Array<Language>
};

type State = {
  exportLocale: ?string,
  translate: boolean,
  isAnonymous: boolean
};

class Step3 extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      exportLocale: null,
      translate: false,
      isAnonymous: false
    };
  }

  handleExportLocaleChange = (locale: string) => {
    this.setState({ exportLocale: locale });
  };

  handleTranslationChange = (shouldTranslate: boolean) => {
    this.setState({ translate: shouldTranslate });
  };

  handleAnonymousChange = () => {
    this.setState(prevState => ({ isAnonymous: !prevState.isAnonymous }));
  };

  render() {
    const { debateId, languages } = this.props;
    const { translate } = this.state;
    const exportLocale = this.state.exportLocale || (languages && languages[0].locale);
    const translation = translate && exportLocale ? `?lang=${exportLocale}` : '?'; // FIXME: using '' instead of '?' does not work
    const { isAnonymous } = this.state;
    const anonymous = translation === '?' ? `anon=${isAnonymous.toString()}` : `&anon=${isAnonymous.toString()}`;
    const exportLink = get('exportSurveyData', { debateId: debateId, translation: translation, anonymous: anonymous });
    return (
      <ExportSection
        withLanguageOptions
        handleExportLocaleChange={this.handleExportLocaleChange}
        handleTranslationChange={this.handleTranslationChange}
        handleAnonymousChange={this.handleAnonymousChange}
        exportLink={exportLink}
        translate={translate}
        exportLocale={exportLocale}
        languages={languages}
        annotation="surveyAnnotation"
      />
    );
  }
}
export default compose(
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
)(Step3);