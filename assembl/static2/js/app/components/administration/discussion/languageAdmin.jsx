import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';

import SectionTitle from '../sectionTitle';
import withLoadingIndicator from '../../common/withLoadingIndicator';
import { addLanguagePreferences, removeLanguagePreference } from '../../../actions/adminActions';
import getAllPreferenceLanguage from '../../../graphql/AllLanguagePreferences.graphql';


class LanguageSection extends React.Component {

  constructor(props) {
    super(props);
    const {i18n, selectedLocale, data } = props;

    const allLangs = {};
    data.defaultPreferences.languages.forEach((lang) => {
      allLangs[lang.locale] = {selected: false, name: lang.name};
    });
    data.discussionPreferences.languages.forEach((lang) => {
      allLangs[lang.locale] = {selected: true, name: lang.name};
    });

    this.state = {
      localeState: allLangs,
    };

    allLangs
  }

  componentWillReceiveProps(nextProps){
    const currentLocale = this.props.i18n.locale;
    const nextLocale = nextProps.i18n.locale;
    if (currentLocale !== nextLocale) {
      //Refresh cache with new information, as the translated names are returned from backend
      this.props.data.refetch({variables: {inLocale: nextLocale }});
    }
  }

  toggleLocale(locale){
    const localeState = this.state.localeState[locale];
    const newState = {...localeState, selected: !localeState.selected};
    this.setState((prevState, props) => {
      return prevState.localeState[locale] = newState;
    })
  }

  render() {
    return (
      <div className="admin-box">
        <SectionTitle i18n={i18n} phase="discussion" tabId="0" annotation={I18n.t('administration.annotation')} />
        <div className="admin-content">
          <div>
            <Translate value='administration.languageChoice' />
          </div>
          <form className='language-list'>
            {Object.keys(allLangs).map((locale) => {
              const localeData = this.state.localeState[locale];
              return (
                <Checkbox checked={localeData.selected } key={locale} >
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

const mapStateToProps = ({ admin: { thematicsById, thematicsInOrder, selectedLocale }, i18n }) => {
  return {
    thematics: thematicsInOrder.filter((id) => {
      return !thematicsById.getIn([id, 'toDelete']);
    }),
    i18n: i18n,
    selectedLocale: selectedLocale
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addLocaleToStore: (locale) => {
      dispatch(addLanguagePreferences(locale));
    },
    removeLocaleFromStore: (locale) => {
      dispatch(removeLanguagePreference(locale));
    }
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(getAllPreferenceLanguage, {
    options: (props) => ({
      variables: {
        inLocale: props.i18n.locale
      }
    })
  }),
  withLoadingIndicator())(LanguageSection);