import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { gql, graphql, withApollo } from 'react-apollo';

import SectionTitle from '../sectionTitle';
import ThemeForm from './themeForm';

const GetThematics = gql`
{
  thematics(identifier:"survey") {
    id,
    titleEntries {
      localeCode,
      value
    }
  }
}
`;

const Theme = ({ client, data, i18n, selectedLocale }) => {
  if (data.loading) {
    return null;
  }

  const addTheme = () => {
    const newThemeId = Math.round(Math.random() * -1000000);
    const thematicsData = client.readQuery({ query: GetThematics });
    thematicsData.thematics.push({
      id: newThemeId,
      titleEntries: [],
      image: undefined,
      __typename: 'Thematic'
    });
    return client.writeQuery({
      query: GetThematics,
      data: thematicsData
    });
  };

  const themes = data.thematics || [];
  return (
    <div className="admin-box">
      <SectionTitle i18n={i18n} phase="survey" tabId="0" annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <form>
          {themes.map((theme, idx) => {
            return <ThemeForm key={theme.id} id={theme.id} index={idx} image={theme.image} selectedLocale={selectedLocale} titleEntries={theme.titleEntries} />;
          })}
          <div onClick={addTheme} className="plus margin-l">+</div>
        </form>
      </div>
    </div>
  );
};

const mapStateToProps = ({ admin }) => {
  return {
    selectedLocale: admin.selectedLocale
  };
};

const ThemeContainer = connect(mapStateToProps)(Theme);

export default withApollo(graphql(GetThematics)(ThemeContainer));