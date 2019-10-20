/* eslint-disable */
// @flow
import * as React from 'react';
import { compose, graphql, type OperationComponent } from 'react-apollo';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import { updateEditLocale } from './actions/adminActions';
import { setTheme } from './actions/themeActions';
import { setCookieItem, getCookieItem, convertToISO639String } from './utils/globalFunctions';
import { manageLoadingOnly } from './components/common/manageErrorAndLoading';
import { firstColor as defaultFirstColour, secondColor as defaultSecondColour } from './globalTheme';
import { availableLocales as defaultAvailableLanguages, defaultLocale } from './constants';
import CoreDiscussionPreferencesQuery from './graphql/CoreDiscussionPreferencesQuery.graphql';

type Props = {
  children: React.Node,
  discussionPreferences: CoreDiscussionPreferencesQuery,
  setDefaultLocale: Function,
  setDefaultTheme: Function,
  error: ?Object
};

const configureDefaultLocale = (availableLanguages: Array<string>, defaultLanguage: string, setDefaultLocale: Function) => {
  if (availableLanguages && availableLanguages.length === 1) {
    // The language of the debate and user will be set to the ONLY language of the debate
    setDefaultLocale(availableLanguages[0]);
  } else if (availableLanguages && availableLanguages.length > 1) {
    let cookieLanguage = getCookieItem('_LOCALE_');
    let browserLanguage = navigator.language ? convertToISO639String(navigator.language) : defaultLanguage;
    console.log('availableLanguages', availableLanguages);
    console.log('cookieLanguage', cookieLanguage);
    console.log('browserLanguage', browserLanguage);

    if (
      cookieLanguage === 'zh_Hans' ||
      cookieLanguage === 'zh_CN' ||
      cookieLanguage === 'zh-Hans' ||
      cookieLanguage === 'zh-CN'
    ) {
      cookieLanguage = 'zh-CN';
    }

    if (
      browserLanguage === 'zh_Hans' ||
      browserLanguage === 'zh_CN' ||
      browserLanguage === 'zh-Hans' ||
      browserLanguage === 'zh-CN'
    ) {
      browserLanguage = 'zh-CN';
    }

    if (cookieLanguage && availableLanguages.includes(cookieLanguage)) {
      console.log('setting to cookie', cookieLanguage);
      setDefaultLocale(cookieLanguage);
    } else if (browserLanguage && availableLanguages.includes(browserLanguage)) {
      console.log('setting to browser', browserLanguage);
      setDefaultLocale(browserLanguage);
    }
  } else {
    // Pick the first language in the list of available languages, fall back to English in no case
    const lang = availableLanguages && availableLanguages.length > 0 ? availableLanguages[0] : defaultLanguage;
    setDefaultLocale(lang);
  }
};

const configureTheme = (firstColor: String, secondColor: String, setDefaultTheme: Function) => {
  setDefaultTheme(firstColor, secondColor);
};

// APPLICATION-LEVEL DEFAULT CONFIGURATIONS ARE MADE HERE
const DumbApplicationContainer = (props: Props) => {
  const { children, discussionPreferences, setDefaultLocale, setDefaultTheme, error } = props;

  // Escape out of when the /graphql route is not present. Present default values instead
  if (error && error.networkError && error.networkError.response.status === 404) {
    console.log('In the error', defaultLocale);
    configureTheme(defaultFirstColour(), defaultSecondColour(), setDefaultTheme);
    configureDefaultLocale(defaultAvailableLanguages, defaultLocale, setDefaultLocale);
  } else {
    const { languages, firstColor, secondColor } = discussionPreferences;
    console.log('OK', languages);
    console.log('OK', defaultLocale);
    configureTheme(firstColor, secondColor, setDefaultTheme);
    configureDefaultLocale(languages.map(l => l.locale), defaultLocale, setDefaultLocale);
  }

  return <React.Fragment>{children}</React.Fragment>;
};

const discussionPreferencesQuery: OperationComponent<CoreDiscussionPreferencesQuery, null, Props> = graphql(
  CoreDiscussionPreferencesQuery,
  {
    props: ({ data }) => data
  }
);

const mapDispatchToProps = dispatch => ({
  setDefaultLocale: locale => {
    dispatch(setLocale(locale));
    dispatch(updateEditLocale(locale));
    setCookieItem('_LOCALE_', locale);
  },
  setDefaultTheme: (firstColor, secondColor) => {
    dispatch(setTheme(firstColor, secondColor));
  }
});

export default compose(discussionPreferencesQuery, connect(null, mapDispatchToProps), manageLoadingOnly)(
  DumbApplicationContainer
);
