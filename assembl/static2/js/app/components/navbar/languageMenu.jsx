/* eslint-disable */
// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import { getAvailableLocales } from '../../utils/i18n';
import manageErrorAndLoading from '../common/manageErrorAndLoading';
import { setCookieItem } from '../../utils/globalFunctions';
import DiscussionPreferences from '../../graphql/DiscussionPreferences.graphql';

const doNothing = () => {};

export const refWidthUpdate = (setWidth: (width: number) => void) => (ref: ?HTMLElement) => {
  if (ref) setWidth(ref.getBoundingClientRect().width);
};

type Props = {
  changeLanguage: Function,
  size: number,
  locale: string,
  style: Object,
  className: string,
  setWidth: Function,
  data: Object
};

class LanguageMenu extends React.Component<Props> {
  static defaultProps = {
    className: ''
  };

  doChangeLanguage(key: string) {
    const { changeLanguage } = this.props;
    let locale = key.replace('-', '_');
    if (locale === 'nb') {
      locale = 'no';
    }
    setCookieItem('_LOCALE_', locale);
    console.log('locale', locale);
    changeLanguage(key);
    location.reload(true);
  }

  getAvailableLanguages = (
    props: Props
  ): {
    availableLocales: Array<string>,
    preferencesMapByLocale: { [string]: { nativeName: string, name: string, locale: string } }
  } => {
    const { data, locale } = props;
    const prefs = data.discussionPreferences.languages;
    const preferencesMapByLocale = {};
    prefs.forEach(p => {
      if (p.locale === 'no') {
        preferencesMapByLocale.nb = { ...p };
        preferencesMapByLocale.nb.locale = 'nb';
      } else {
        preferencesMapByLocale[p.locale] = { ...p };
        preferencesMapByLocale[p.locale].name = p.name.split(' (')[0]; // shorten the name for japanese, not need for hiragana
        preferencesMapByLocale[p.locale].nativeName = p.nativeName.split(' (')[0];
      }
    });
    const availableLocales = getAvailableLocales(locale, preferencesMapByLocale);
    return { availableLocales: availableLocales, preferencesMapByLocale: preferencesMapByLocale };
  };

  getLocaleLabel = (preferencesMapByLocale, locale) => {
    const info = preferencesMapByLocale[locale];
    return info ? info.nativeName : locale;
  };

  render() {
    const { size, locale, style, className, setWidth = doNothing } = this.props;
    const { availableLocales, preferencesMapByLocale } = this.getAvailableLanguages(this.props);
    console.log('availableLocales', availableLocales);
    if (availableLocales.length > 0) {
      return (
        <ul ref={refWidthUpdate(setWidth)} className={`dropdown-${size} uppercase ${className}`} style={style}>
          <NavDropdown pullRight title={locale.split('-')[0]} id="nav-dropdown">
            <MenuItem key={locale} className="active">
              {this.getLocaleLabel(preferencesMapByLocale, locale)}
            </MenuItem>
            {availableLocales.map(availableLocale => (
              <MenuItem
                onClick={() => {
                  this.doChangeLanguage(availableLocale);
                }}
                key={availableLocale}
              >
                {this.getLocaleLabel(preferencesMapByLocale, availableLocale)}
              </MenuItem>
            ))}
          </NavDropdown>
        </ul>
      );
    }
    return null;
  }
}

const mapStateToProps = state => ({
  locale: state.i18n.locale
});

const mapDispatchToProps = dispatch => ({
  changeLanguage: locale => {
    dispatch(setLocale(locale));
  }
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(DiscussionPreferences, {
    options: props => ({
      variables: {
        inLocale: props.locale
      }
    })
  }),
  manageErrorAndLoading({ displayLoader: false })
)(LanguageMenu);
