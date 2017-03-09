import React from 'react';
import { connect } from 'react-redux';
import { setLocale } from 'react-redux-i18n';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import { getAvailableLocales } from '../../utils/globalFunctions';

class LanguageMenu extends React.Component {
  changeLanguage(key) {
    localStorage.setItem('locale', key);
    this.props.changeLanguage(key);
  }
  render() {
    const { locale, translations } = this.props.i18n;
    const { size } = this.props;
    const availableLocales = getAvailableLocales(locale, translations);
    return (
      <ul className={`dropdown-${size}`}>
        <NavDropdown title={locale} id="nav-dropdown">
          {availableLocales.map((loc) => {
            return (<MenuItem onClick={() => { this.changeLanguage(loc); }} key={loc}>{loc}</MenuItem>);
          }
          )}
        </NavDropdown>
      </ul>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
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