import React from 'react';
import { I18n } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';

import SectionTitle from '../sectionTitle';
import withLoadingIndicator from '../../common/withLoadingIndicator';
import getAllPreferenceLanguage from '../../../graphql/AllLanguagePreferences.graphql';


class LanguageSection extends React.Component {

  componentWillReceiveProps(nextProps){
    const currentLocale = this.props.i18n.locale;
    const nextLocale = nextProps.i18n.locale;
    if (currentLocale !== nextLocale) {
      //Refresh cache with new information, as the translated names are returned from backend
      this.props.data.refetch({variables: {inLocale: nextLocale }});
    }
  }

  render() {
    const {i18n, selectedLocale, data } = this.props;
    console.log(data);
    return (
      <div className="admin-box">
        <SectionTitle i18n={i18n} phase="discussion" tabId="0" annotation={I18n.t('administration.annotation')} />
        <div className="admin-content">
          <form>
            
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