import React from 'react';
import { gql, graphql, withApollo } from 'react-apollo';
import { connect } from 'react-redux';

import ThemeSection from '../components/administration/survey/themeSection';
import QuestionSection from '../components/administration/survey/questionSection';
import ExportSection from '../components/administration/survey/exportSection';
import Navbar from '../components/administration/navbar';

const GetThematics = gql`
{
  thematics(identifier:"survey") {
    id,
    titleEntries {
      localeCode,
      value
    },
    imgUrl,
    video {
      title,
      description,
      htmlCode
    },
    questions {
      titleEntries {
        localeCode,
        value
      }
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
        <ThemeSection
          i18n={i18n}
          selectedLocale={selectedLocale}
          data={data}
        />
      }
      {section === '2' &&
        <QuestionSection
          i18n={i18n}
          selectedLocale={selectedLocale}
          data={data}
          thematicId={thematicId}
        />
      }
      {section === '3' &&
        <ExportSection i18n={i18n} />
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