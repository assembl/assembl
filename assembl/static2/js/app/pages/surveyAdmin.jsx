import React from 'react';
import { gql, graphql, withApollo } from 'react-apollo';
import { connect } from 'react-redux';

import Theme from '../components/administration/survey/theme';
import Question from '../components/administration/survey/question';
import Export from '../components/administration/survey/export';
import Navbar from '../components/administration/navbar';

const GetThematics = gql`
{
  thematics(identifier:"survey") {
    id,
    titleEntries {
      localeCode,
      value
    },
    video {
      htmlCode,
      title,
      description
    }
  }
}
`;

const SurveyAdmin = ({ data, i18n, selectedLocale, section, thematicId }) => {
  if (data.loading) {
    return null;
  }

  const currentStep = parseInt(section, 10);
  return (
    <div className="survey-admin">
      {section === '1' &&
        <Theme
          i18n={i18n}
          selectedLocale={selectedLocale}
          data={data}
        />
      }
      {section === '2' &&
        <Question
          i18n={i18n}
          selectedLocale={selectedLocale}
          data={data}
          thematicId={thematicId}
        />
      }
      {section === '3' &&
        <Export i18n={i18n} />
      }
      {!isNaN(currentStep) &&
        <Navbar
          currentStep={currentStep}
          totalSteps={3}
          phaseIdentifier="survey"
        />
      }
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n,
    selectedLocale: state.admin.selectedLocale
  };
};

const SurveyAdminContainer = connect(mapStateToProps)(SurveyAdmin);

export default withApollo(graphql(GetThematics)(SurveyAdminContainer));