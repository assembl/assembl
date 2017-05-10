import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

import { addThemeToSurvey } from '../../../actions/adminActions';
import SectionTitle from '../sectionTitle';
import ThemeCreationForm from './themeCreationForm';

const ThemeCreation = ({ addTheme, i18n, selectedLocale, showSection, themes }) => {
  return (
    <div className={showSection ? 'show admin-box' : 'hidden'}>
      <SectionTitle i18n={i18n} tabId="0" annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <form>
          {themes.map((id) => {
            return <ThemeCreationForm key={id} id={id} selectedLocale={selectedLocale} />;
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
    selectedLocale: admin.selectedLocale,
    themes: admin.surveyThemes
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addTheme: () => {
      return dispatch(addThemeToSurvey());
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ThemeCreation);