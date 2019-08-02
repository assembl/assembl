// @flow
import * as React from 'react';
import { compose, graphql, type OperationComponent } from 'react-apollo';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import { updateEditLocale } from './actions/adminActions';
import { setCookieItem, convertToISO639String } from './utils/globalFunctions';
import manageErrorAndLoading from './components/common/manageErrorAndLoading';
import CoreDiscussionPreferencesQuery from './graphql/CoreDiscussionPreferencesQuery.graphql';

type Props = {
  children: React.Node,
  discussionPreferences: CoreDiscussionPreferencesQuery,
  setDefaultLocale: Function
};

const configureDefaultLocale = (availableLanguages: Array<string>, defaultLanguage: string, setDefaultLocale: Function) => {
  if (availableLanguages && availableLanguages.length === 1) {
    // The language of the debate and user will be set to the language of the debate
    setDefaultLocale(availableLanguages[0]);
  } else if (availableLanguages && availableLanguages.length > 1) {
    let browserLanguage = navigator.language;
    browserLanguage = browserLanguage ? convertToISO639String(browserLanguage) : defaultLanguage;
    if (browserLanguage && availableLanguages.includes(browserLanguage)) {
      setDefaultLocale(browserLanguage);
    }
  } else {
    // Pick the first language in the list of available languages, fall back to English in no case
    const lang = availableLanguages && availableLanguages.length > 0 ? availableLanguages[0] : defaultLanguage;
    setDefaultLocale(lang);
  }
};

// APPLICATION-LEVEL DEFAULT CONFIGURATIONS ARE MADE HERE
const DumbApplicationContainer = (props: Props) => {
  const { children, discussionPreferences, setDefaultLocale } = props;
  const { languages } = discussionPreferences;

  // When application loaded, it either picked a locale from the cookie previously set by the user, or nothing at all.
  // Here, with the knowledge of the available locale of the debate, and with user agent, can set the language of the debate
  configureDefaultLocale(languages.map(l => l.locale), 'en', setDefaultLocale);
  return <React.Fragment>{children}</React.Fragment>;
};

const discussionPreferencesQuery: OperationComponent<CoreDiscussionPreferencesQuery, null, Props> = graphql(
  CoreDiscussionPreferencesQuery,
  {
    props: ({ data }) => data
  }
);

const mapDispatchToProps = dispatch => ({
  setDefaultLocale: (locale) => {
    dispatch(setLocale(locale));
    dispatch(updateEditLocale(locale));
    setCookieItem('_LOCALE_', locale);
  }
});

export default compose(
  discussionPreferencesQuery,
  connect(null, mapDispatchToProps),
  manageErrorAndLoading({ displayLoader: true })
)(DumbApplicationContainer);