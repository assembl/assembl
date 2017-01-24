import React from 'react';
import { connect } from 'react-redux';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import GlobalFunctions from '../../utils/globalFunctions';
import MapStateToProps from '../../store/mapStateToProps';
import MapDispatchToProps from '../../store/mapDispatchToProps';

class LanguageMenu extends React.Component {
  changeLanguage(key) {
    localStorage.setItem('locale', key);
    this.props.changeLanguage(key);
  }
  render() {
    const { locale, translations } = this.props.i18n;
    const { size } = this.props;
    const avalaibleLocales = GlobalFunctions.getAvalaibleLocales(locale, translations);
    return (
      <ul className={`dropdown-${size}`}>
        <NavDropdown title={locale} id="nav-dropdown">
          {avalaibleLocales.map((loc) => {
            return (<MenuItem onClick={() => { this.changeLanguage(loc); }} key={loc}>{loc}</MenuItem>);
          }
          )}
        </NavDropdown>
      </ul>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(LanguageMenu);