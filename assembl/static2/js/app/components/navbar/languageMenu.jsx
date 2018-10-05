// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import { getAvailableLocales } from '../../utils/i18n';
import { addLanguagePreference } from '../../actions/adminActions';
import manageErrorAndLoading from '../common/manageErrorAndLoading';
import { setCookieItem } from '../../utils/globalFunctions';
import getDiscussionPreferenceLanguage from '../../graphql/DiscussionPreferenceLanguage.graphql';

const doNothing = () => {};

export const refWidthUpdate = (setWidth: (width: number) => void) => (ref: ?HTMLElement) => {
  if (ref) setWidth(ref.getBoundingClientRect().width);
};

type Props = {
  changeLanguage: Function,
  addLanguageToStore: Function,
  size: number,
  i18n: Object,
  style: Object,
  className: string,
  setWidth: Function,
  data: Object
};

type State = {
  availableLocales: Array<string>,
  preferencesMapByLocale: { [string]: { nativeName: string, name: string, locale: string } }
};

class LanguageMenu extends React.Component<Props, State> {
  static defaultProps = {
    className: ''
  };

  constructor(props) {
    super(props);
    this.state = { availableLocales: [], preferencesMapByLocale: {} };
  }

  componentWillMount() {
    this.setAvailableLanguages(this.props);
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setAvailableLanguages(nextProps);
  }

  doChangeLanguage(key: string) {
    const { changeLanguage } = this.props;
    let locale = key.replace('-', '_');
    if (locale === 'nb') {
      locale = 'no';
    }
    setCookieItem('_LOCALE_', locale);
    changeLanguage(key);
    location.reload(true);
  }

  setAvailableLanguages = (props: Props) => {
    const { addLanguageToStore, data, i18n } = props;
    const prefs = data.discussionPreferences.languages;
    const preferencesMapByLocale = {};
    prefs.forEach((p) => {
      if (p.locale === 'zh_Hans') {
        preferencesMapByLocale['zh-CN'] = { ...p };
        preferencesMapByLocale['zh-CN'].name = p.name.split(' (')[0]; // shorten the name for chinese
        preferencesMapByLocale['zh-CN'].nativeName = p.nativeName.split(' (')[0];
        preferencesMapByLocale['zh-CN'].locale = 'zh-CN';
      } else if (p.locale === 'no') {
        preferencesMapByLocale.nb = { ...p };
        preferencesMapByLocale.nb.locale = 'nb';
      } else {
        preferencesMapByLocale[p.locale] = { ...p };
        preferencesMapByLocale[p.locale].name = p.name.split(' (')[0]; // shorten the name for japanese, not need for hiragana
        preferencesMapByLocale[p.locale].nativeName = p.nativeName.split(' (')[0];
      }
      // Big side effect, addLanguageToStore needs to be called here for the languages in the admininistration page
      // to be selected... if we remove that line, we can remove the state, componentWillMount, componentWillReceiveProps
      // and just calculate availableLocales and preferencesMapByLocale in render.
      addLanguageToStore(p.locale);
    });
    const availableLocales = getAvailableLocales(i18n.locale, preferencesMapByLocale);
    this.setState({ availableLocales: availableLocales, preferencesMapByLocale: preferencesMapByLocale });
  };

  getLocaleLabel = (locale) => {
    const info = this.state.preferencesMapByLocale[locale];
    return info ? info.nativeName : locale;
  };

  render() {
    const { size, i18n, style, className, setWidth = doNothing } = this.props;
    if (this.state.availableLocales.length > 0) {
      return (
        <ul ref={refWidthUpdate(setWidth)} className={`dropdown-${size} uppercase ${className}`} style={style}>
          <NavDropdown pullRight title={i18n.locale.split('-')[0]} id="nav-dropdown">
            <MenuItem key={i18n.locale} className="active">
              {this.getLocaleLabel(i18n.locale)}
            </MenuItem>
            {this.state.availableLocales.map(availableLocale => (
              <MenuItem
                onClick={() => {
                  this.doChangeLanguage(availableLocale);
                }}
                key={availableLocale}
              >
                {this.getLocaleLabel(availableLocale)}
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
  i18n: state.i18n
});

const mapDispatchToProps = dispatch => ({
  changeLanguage: (locale) => {
    dispatch(setLocale(locale));
  },
  addLanguageToStore: (locale) => {
    dispatch(addLanguagePreference(locale));
  }
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(getDiscussionPreferenceLanguage, {
    options: props => ({
      variables: {
        inLocale: props.i18n.locale
      }
    })
  }),
  manageErrorAndLoading({ displayLoader: false })
)(LanguageMenu);