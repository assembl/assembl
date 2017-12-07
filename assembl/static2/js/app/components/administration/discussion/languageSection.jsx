import React from 'react';
import { List } from 'immutable';
import { I18n, Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';

import SectionTitle from '../sectionTitle';
import withLoadingIndicator from '../../common/withLoadingIndicator';
import { addLanguagePreference, removeLanguagePreference, languagePreferencesHasChanged } from '../../../actions/adminActions';
import getAllPreferenceLanguage from '../../../graphql/AllLanguagePreferences.graphql';

class LanguageSection extends React.Component {
  constructor(props) {
    super(props);
    const { discussionLanguagePreferences, data } = props;

    const allLangs = {};
    data.defaultPreferences.languages.forEach((lang) => {
      allLangs[lang.locale] = { selected: false, name: lang.name };
    });

    discussionLanguagePreferences.forEach((locale) => {
      const prevState = allLangs[locale];
      allLangs[locale] = { ...prevState, selected: true };
    });

    this.state = {
      localeState: allLangs
    };
  }

  componentWillMount() {
    // Hide the admin language menu
    this.props.toggleLanguageMenu(false);
  }

  componentWillReceiveProps(nextProps) {
    // Manage the change in interface locale, causing language names to change
    const currentLocale = this.props.i18n.locale;
    const nextLocale = nextProps.i18n.locale;
    if (currentLocale !== nextLocale) {
      // Refresh cache with new information, as the translated names are returned from backend
      this.props.data.refetch({ variables: { inLocale: nextLocale } });
    }

    // Manage toggling of checkbox states from the store
    const totalLocaleList = List(Object.keys(this.state.localeState));
    const currentSelectedLocaleList = totalLocaleList.filter(locale => this.state.localeState[locale].selected).sort();
    const newLocalePreferences = nextProps.discussionLanguagePreferences.sort();
    // Only update the state if there is a change in language preferences
    if (!currentSelectedLocaleList.equals(newLocalePreferences)) {
      const newState = { ...this.state.localeState };
      Object.entries(newState).forEach(([locale, state]) => {
        const selectedState = state;
        if (newLocalePreferences.includes(locale)) {
          selectedState.selected = true;
        } else {
          selectedState.selected = false;
        }
      });
      this.setState({ localeState: newState });
    }
  }

  toggleLocale(locale) {
    const currentLocale = this.props.i18n.locale;
    this.props.signalLocaleChanged(true);
    const transientState = this.state.localeState[locale];
    const newState = { ...transientState, selected: !transientState.selected };
    if (newState.selected) {
      this.props.addLocaleToStore(locale);
    } else if (currentLocale !== locale) {
      this.props.removeLocaleFromStore(locale);
    }
  }

  render() {
    const currentLocale = this.props.i18n.locale;
    return (
      <div className="admin-box">
        <SectionTitle title={I18n.t('administration.discussion.0')} annotation={I18n.t('administration.annotation')} />
        <div className="admin-language-content">
          <div>
            <Translate value="administration.languageChoice" />
          </div>
          <form className="language-list">
            {Object.keys(this.state.localeState).map((locale) => {
              const localeData = this.state.localeState[locale];
              return (
                <Checkbox
                  checked={currentLocale === locale ? true : localeData.selected}
                  key={locale}
                  value={locale}
                  onChange={e => this.toggleLocale(e.target.value)}
                >
                  {localeData.name}
                </Checkbox>
              );
            })}
          </form>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { discussionLanguagePreferences }, i18n }) => ({
  i18n: i18n,
  discussionLanguagePreferences: discussionLanguagePreferences
});

const mapDispatchToProps = dispatch => ({
  addLocaleToStore: (locale) => {
    dispatch(addLanguagePreference(locale));
  },
  removeLocaleFromStore: (locale) => {
    dispatch(removeLanguagePreference(locale));
  },
  signalLocaleChanged: (state) => {
    dispatch(languagePreferencesHasChanged(state));
  }
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(getAllPreferenceLanguage, {
    options: props => ({
      variables: {
        inLocale: props.i18n.locale
      }
    })
  }),
  withLoadingIndicator()
)(LanguageSection);