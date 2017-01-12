import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import Statistic from './statistic';

class Header extends React.Component {
  render() {
    return (
      <div className="header">
        <div className="header-content">
          <img className="header-logo" src="../../../../static2/css/img/default_logo.png" alt="logo" />
          <div className="title-1">Qu&apos;est-ce qu&apos;une ville inclusive ?</div>
          <div className="title-3">DEBAT INTERNATIONAL</div>
          <div className="title-4">DU 16.09.2016 AU 20.12.2016</div>
          <Button className="button-success margin-l">
            <Translate value="home.accessButton" />
          </Button>
          <Statistic />
        </div>
        <div className="header-bkg">
          <img src="../../../../static2/css/img/default_header.jpg" alt="header" />
        </div>
      </div>
    );
  }
}

export default Header;