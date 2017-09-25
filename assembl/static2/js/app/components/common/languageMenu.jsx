import React from 'react';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import { compose, graphql, withApollo } from 'react-apollo';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import { getAvailableLocales } from '../../utils/globalFunctions';
import { addLanguagePreference } from '../../actions/adminActions';
import withLoadingIndicator from './withLoadingIndicator';
import getDiscussionPreferenceLanguage from '../../graphql/DiscussionPreferenceLanguage.graphql';

const LanguageMenu = ({ i18n, size, changeLanguage, addLanguageToStore, client }) => {
  const doChangeLanguage = (key) => {
    localStorage.setItem('locale', key);
    changeLanguage(key);
  };

  const { locale } = i18n;

  const dataFromStore = client.readQuery({
    query: getDiscussionPreferenceLanguage,
    variables: { inLocale: locale }
  });

  const prefs = dataFromStore.discussionPreferences.languages;

  const preferencesMapByLocale = {};
  prefs.forEach((p) => {
    preferencesMapByLocale[p.locale] = p;
    addLanguageToStore(p.locale);
  });
  const availableLocales = getAvailableLocales(locale, preferencesMapByLocale);
  if (availableLocales.length > 0) {
    return (
      <ul className={`dropdown-${size} uppercase`}>
        <NavDropdown pullRight title={locale} id="nav-dropdown">
          {availableLocales.map((availableLocale) => {
            return (
              <MenuItem
                onClick={() => {
                  doChangeLanguage(availableLocale);
                }}
                key={availableLocale}
              >
                {availableLocale}
              </MenuItem>
            );
          })}
        </NavDropdown>
      </ul>
    );
  }
  return null;
};

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeLanguage: (locale) => {
      dispatch(setLocale(locale));
    },
    addLanguageToStore: (locale) => {
      dispatch(addLanguagePreference(locale));
    }
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(getDiscussionPreferenceLanguage, {
    options: (props) => {
      return {
        variables: {
          inLocale: props.i18n.locale
        }
      };
    }
  }),
  withLoadingIndicator(),
  withApollo
)(LanguageMenu);