import React from 'react';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import { getAvailableLocales } from '../../utils/globalFunctions';
import { addLanguagePreference } from '../../actions/adminActions';
import withLoadingIndicator from './withLoadingIndicator';
import getDiscussionPreferenceLanguage from '../../graphql/DiscussionPreferenceLanguage.graphql';

class LanguageMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { availableLocales: [] };
  }
  componentWillMount() {
    const { addLanguageToStore, data, i18n } = this.props;
    const prefs = data.discussionPreferences.languages;
    const preferencesMapByLocale = {};
    prefs.forEach((p) => {
      preferencesMapByLocale[p.locale] = p;
      addLanguageToStore(p.locale);
    });
    const availableLocales = getAvailableLocales(i18n.locale, preferencesMapByLocale);
    this.setState({ availableLocales: availableLocales });
  }
  componentWillReceiveProps(nextProps) {
    const { addLanguageToStore, data, i18n } = nextProps;
    const prefs = data.discussionPreferences.languages;
    const preferencesMapByLocale = {};
    prefs.forEach((p) => {
      preferencesMapByLocale[p.locale] = p;
      addLanguageToStore(p.locale);
    });
    const availableLocales = getAvailableLocales(i18n.locale, preferencesMapByLocale);
    this.setState({ availableLocales: availableLocales });
  }
  doChangeLanguage(key) {
    const { changeLanguage } = this.props;
    localStorage.setItem('locale', key);
    changeLanguage(key);
  }
  render() {
    const { size, i18n } = this.props;
    if (this.state.availableLocales.length > 0) {
      return (
        <ul className={`dropdown-${size} uppercase`}>
          <NavDropdown pullRight title={i18n.locale} id="nav-dropdown">
            {this.state.availableLocales.map((availableLocale) => {
              return (
                <MenuItem
                  onClick={() => {
                    this.doChangeLanguage(availableLocale);
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
  }
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
  withLoadingIndicator()
)(LanguageMenu);