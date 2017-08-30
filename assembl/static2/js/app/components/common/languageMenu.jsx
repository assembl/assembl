import React from 'react';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import { getAvailableLocales } from '../../utils/globalFunctions';
import withLoadingIndicator from './withLoadingIndicator';
import getDiscussionPreferenceLanguage from '../../graphql/DiscussionPreferenceLanguage.graphql';

const LanguageMenu = ({ i18n, size, changeLanguage, data }) => {

  const _doChangeLanguage = (key) => {
    localStorage.setItem('locale', key);
    changeLanguage(key);
  };

  const { locale, translations } = i18n;
  const prefs = data.discussionPreferences.languages;

  let prefObject = {};
  prefs.forEach((p) => { prefObject[p.locale] = p });
  const availableLocales = getAvailableLocales(locale, prefObject);
  return (
    <ul className={`dropdown-${size} uppercase`}>
      <NavDropdown pullRight title={locale} id="nav-dropdown">
        {availableLocales.map((loc) => {
          return (
            <MenuItem
              onClick={() => {
                _doChangeLanguage(loc);
              }}
              key={loc}
            >
              {loc}
            </MenuItem>
          );
        })}
      </NavDropdown>
    </ul>
  );
}

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeLanguage: (locale) => {
      dispatch(setLocale(locale));
    }
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(getDiscussionPreferenceLanguage, {
    options: (props) => ({
      variables: {
        inLocale: props.i18n.locale
      }
    })
  }),
  withLoadingIndicator())(LanguageMenu);
