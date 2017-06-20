import React from 'react';
import { connect } from 'react-redux';

import { updateSelectedLocale } from '../../actions/adminActions';
import En from '../svg/flags/en';
import Fr from '../svg/flags/fr';

// TO DO get it dynamically
const Flag = ({ locale }) => {
  switch (locale) {
  case 'en':
    return <En />;
  case 'fr':
    return <Fr />;
  default:
    return <Fr />;
  }
};

const LanguageMenu = ({ changeLocale, selectedLocale, translations }) => {
  return (
    <div className="relative">
      <div className="language-menu">
        {Object.keys(translations).map((key, index) => {
          return (
            <div
              onClick={() => {
                return changeLocale(key);
              }}
              id={key}
              className={selectedLocale === key ? 'flag-container active' : 'flag-container'}
              key={index}
            >
              <Flag locale={key} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    translations: state.i18n.translations,
    selectedLocale: state.admin.selectedLocale
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeLocale: (newLocale) => {
      dispatch(updateSelectedLocale(newLocale));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LanguageMenu);