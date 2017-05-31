import React from 'react';
import { I18n } from 'react-redux-i18n';
import { gql, withApollo } from 'react-apollo';

import SectionTitle from '../sectionTitle';
import ThemeForm from './themeForm';

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

const ThemeSection = ({ client, i18n, selectedLocale }) => {
  const addTheme = () => {
    const newThemeId = Math.round(Math.random() * -1000000);
    const thematicsData = client.readQuery({ query: GetThematics });
    thematicsData.thematics.push({
      id: newThemeId,
      titleEntries: [],
      imgUrl: undefined,
      questions: [],
      video: [],
      __typename: 'Thematic'
    });
    return client.writeQuery({
      query: GetThematics,
      data: thematicsData
    });
  };

  const thematicsData = client.readQuery({ query: GetThematics });
  const themes = thematicsData.thematics || [];

  return (
    <div className="admin-box">
      <SectionTitle i18n={i18n} phase="survey" tabId="0" annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <form>
          {themes.map((theme, idx) => {
            return <ThemeForm key={theme.id} id={theme.id} index={idx} imgUrl={theme.imgUrl} selectedLocale={selectedLocale} titleEntries={theme.titleEntries} />;
          })}
          <div onClick={addTheme} className="plus margin-l">+</div>
        </form>
      </div>
    </div>
  );
};

export default withApollo(ThemeSection);