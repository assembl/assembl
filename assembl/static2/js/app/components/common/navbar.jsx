import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Glyphicon } from 'react-bootstrap';
import ProfileIcon from './profileIcon';
import LanguageMenu from './languageMenu';

class NavBar extends React.Component {
  render() {
    return (
      <div className="navbar">
        <div className="left">
          <div className="navbar-logo">
            <img src="../../../../static2/css/img/default_logo.png" alt="logo" />
          </div>
        </div>
        <div className="left">
          <a className="navbar-item-menu active" href="/home">
            <Translate value="navbar.home" />
          </a>
          <a className="navbar-item-menu" href="/debate">
            <Translate value="navbar.debate" />
          </a>
          <a className="navbar-item-menu" href="/community">
            <Translate value="navbar.community" />
          </a>
        </div>
        <div className="right">
          <div className="navbar-icons">
            <div className="rounded-icon"><Glyphicon glyph="search" /></div>
            <div className="white-icon"><Glyphicon glyph="question-sign" /></div>
            <LanguageMenu />
            <ProfileIcon />
          </div>
        </div>
      </div>
    );
  }
}

export default NavBar;