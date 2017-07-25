import React from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger } from 'react-bootstrap';
import { languageTooltip } from '../common/tooltips';

import { updateSelectedLocale } from '../../actions/adminActions';
import En from '../svg/flags/en';
import Fr from '../svg/flags/fr';
import Jp from '../svg/flags/jp';

// TO DO get it dynamically
const Flag = ({ locale }) => {
  switch (locale) {
  case 'en':
    return <En />;
  case 'fr':
    return <Fr />;
  case 'jp':
    return <Jp />;
  default:
    return (
      <span>
        {locale}
      </span>
    );
  }
};

const LanguageMenu = ({ changeLocale, selectedLocale, translations }) => {
  return (
    <div className="relative">
      <div className="language-menu">
        <OverlayTrigger placement="top" overlay={languageTooltip}>
          <div>
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
        </OverlayTrigger>
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