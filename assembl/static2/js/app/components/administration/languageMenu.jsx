import React from 'react';
import { connect } from 'react-redux';
import En from '../svg/flags/en';
import Fr from '../svg/flags/fr';

const Flag = (locale) => {
  switch (locale) {
  case 'en':
    return <En />;
  case 'fr':
    return <Fr />;
  default:
    return <Fr />;
  }
};

class LanguageMenu extends React.Component {
  render() {
    const { translations } = this.props.i18n;
    return (
      <div className="relative">
        <div className="language-menu">
          {Object.keys(translations).map((key, index) => {
            return (
              <div className="flag-container" key={index}>
                {Flag(key)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(LanguageMenu);