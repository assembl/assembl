import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { gql, graphql, withApollo } from 'react-apollo';
import { Button } from 'react-bootstrap';

import SectionTitle from '../sectionTitle';
import ThemeCreationForm from './themeCreationForm';

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

const ThemeCreation = ({ client, data, i18n, selectedLocale, showSection }) => {
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
    <div className={showSection ? 'show admin-box' : 'hidden'}>
      <SectionTitle i18n={i18n} phase="survey" tabId="0" annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <form>
          {themes.map((theme, idx) => {
            return <ThemeCreationForm key={theme.id} id={theme.id} index={idx} image={theme.image} selectedLocale={selectedLocale} titleEntries={theme.titleEntries} />;
          })}
          <div onClick={addTheme} className="plus margin-l">+</div>
          <Button className="button-submit button-dark margin-l">Suivant</Button>
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

const ThemeCreationContainer = connect(mapStateToProps)(ThemeCreation);

export default withApollo(graphql(GetThematics)(ThemeCreationContainer));