import React from 'react';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import { NavDropdown, MenuItem } from 'react-bootstrap';

class LanguageMenu extends React.Component {
  changeLanguage(key) {
    this.props.changeLanguage(key);
    localStorage.setItem('locale', key);
  }
  render() {
    const { locale, translations } = this.props.i18n;
    const locArray = [];
    Object.keys(translations).map((key) => {
      if (key !== locale) locArray.push(key);
      return locArray;
    });
    return (
      <ul className="dropdown-xs right">
        <NavDropdown title={locale} id="nav-dropdown">
          {locArray.map((otherLocales) => {
            return (<MenuItem onClick={() => { this.changeLanguage(otherLocales); }} key={otherLocales}>{otherLocales}</MenuItem>);
          }
          )}
        </NavDropdown>
      </ul>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n,
    debate: state.debate
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeLanguage: (locale) => {
      dispatch(setLocale(locale));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LanguageMenu);