import React from 'react';
import { connect } from 'react-redux';
import { addAdminData } from '../actions/adminActions';
import ThemeCreation from '../components/administration/survey/themeCreation';
import ThemeEdition from '../components/administration/survey/themeEdition';
import SurveyExport from '../components/administration/survey/surveyExport';

class SurveyAdmin extends React.Component {
  constructor(props) {
    super(props);
    const { selectedLocale } = this.props.admin;
    // TO DO: get it from the API!
    const surveyData = {};
    this.props.addAdminData(selectedLocale, surveyData);
  }
  render() {
    const { i18n, section } = this.props;
    return (
      <div className="survey-admin">
        <ThemeCreation i18n={i18n} showSection={section === 'section1'} />
        <ThemeEdition i18n={i18n} showSection={section === 'section2'} />
        <SurveyExport i18n={i18n} showSection={section === 'section3'} />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    admin: state.admin,
    i18n: state.i18n
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addAdminData: (selectedLocale, surveyData) => {
      dispatch(addAdminData(selectedLocale, surveyData));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SurveyAdmin);