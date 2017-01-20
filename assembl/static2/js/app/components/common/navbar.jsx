import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Navbar, Glyphicon } from 'react-bootstrap';
import ProfileIcon from './profileIcon';
import LanguageMenu from './languageMenu';

class NavBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuHidden: true
    };
    this.displayMenu = this.displayMenu.bind(this);
  }
  displayMenu() {
    const { isMenuHidden } = this.state;
    if (!isMenuHidden) this.setState({ isMenuHidden: true });
    if (isMenuHidden) this.setState({ isMenuHidden: false });
  }
  render() {
    const { debateData } = this.props.debate;
    return (
      <Grid fluid>
        <Row>
          <Navbar fixedTop fluid>
            <div className="nav-bar">
              <div className="left burger-menu" onClick={this.displayMenu}>
                <div className={this.state.isMenuHidden ? 'black-icon shown' : 'black-icon hidden'}><Glyphicon glyph="align-justify" /></div>
                <div className={this.state.isMenuHidden ? 'black-icon hidden' : 'black-icon shown'}><Glyphicon glyph="remove" /></div>
              </div>
              <div className="left navbar-logo">
                <img src={debateData.logo} alt="logo" />
              </div>
              <div className="nav-menu left">
                <Link className="navbar-item-menu" activeClassName="active" to={`/v2/${debateData.slug}/home`}>
                  <Translate value="navbar.home" />
                </Link>
                <Link className="navbar-item-menu" activeClassName="active" to={`/v2/${debateData.slug}/debate`}>
                  <Translate value="navbar.debate" />
                </Link>
                <Link className="navbar-item-menu" activeClassName="active" to={`/v2/${debateData.slug}/community`}>
                  <Translate value="navbar.community" />
                </Link>
              </div>
              <div className="right">
                <div className="navbar-icons">
                  <div className="white-icon"><Glyphicon glyph="question-sign" /></div>
                  <LanguageMenu />
                  <ProfileIcon />
                </div>
              </div>
              <div className={this.state.isMenuHidden ? 'nav-burger-menu hidden' : 'nav-burger-menu shown'}>
                <Link className="navbar-item-menu" activeClassName="active" to={`/v2/${debateData.slug}/home`} onClick={this.displayMenu}>
                  <Translate value="navbar.home" />
                </Link>
                <Link className="navbar-item-menu" activeClassName="active" to={`/v2/${debateData.slug}/debate`} onClick={this.displayMenu}>
                  <Translate value="navbar.debate" />
                </Link>
                <Link className="navbar-item-menu" activeClassName="active" to={`/v2/${debateData.slug}/community`} onClick={this.displayMenu}>
                  <Translate value="navbar.community" />
                </Link>
              </div>
            </div>
          </Navbar>
        </Row>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(NavBar);