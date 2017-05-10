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
    const { section } = this.props;
    return (
      <div className="survey-admin">
        {section === 'section1' &&
          <ThemeCreation />
        }
        {section === 'section2' &&
          <ThemeEdition />
        }
        {section === 'section3' &&
          <SurveyExport />
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    admin: state.admin
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