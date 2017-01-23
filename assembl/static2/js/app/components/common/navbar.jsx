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
    const { path } = this.props;
    return (
      <Grid fluid>
        <Row>
          <Navbar fixedTop fluid>
            <div className="nav-bar">
              <div className="burgermenu-icon left" onClick={this.displayMenu}>
                <div className={this.state.isMenuHidden ? 'black-icon shown' : 'black-icon hidden'}><Glyphicon glyph="align-justify" /></div>
                <div className={this.state.isMenuHidden ? 'black-icon hidden' : 'black-icon shown'}><Glyphicon glyph="remove" /></div>
              </div>
              <div className="navbar-logo left">
                <img src={debateData.logo} alt="logo" />
              </div>
              <div className="nav-menu left">
                <Link className="navbar-menu-item" activeClassName="active" to={`${path}${debateData.slug}/home`}>
                  <Translate value="navbar.home" />
                </Link>
                <Link className="navbar-menu-item" activeClassName="active" to={`${path}${debateData.slug}/debate`}>
                  <Translate value="navbar.debate" />
                </Link>
                <Link className="navbar-menu-item" activeClassName="active" to={`${path}${debateData.slug}/community`}>
                  <Translate value="navbar.community" />
                </Link>
              </div>
              <div className="navbar-icons right">
                <div className="white-icon">
                  <a href={`${debateData.help_url}`} target="_blank" rel="noopener noreferrer"><Glyphicon glyph="question-sign" /></a>
                </div>
                <div className="navbar-language right">
                  <LanguageMenu size="xs" />
                </div>
                <ProfileIcon />
              </div>
              <div className={this.state.isMenuHidden ? 'nav-burger-menu hidden' : 'nav-burger-menu shown'}>
                <Link className="navbar-menu-item" activeClassName="active" to={`${path}${debateData.slug}/home`} onClick={this.displayMenu}>
                  <Translate value="navbar.home" />
                </Link>
                <Link className="navbar-menu-item" activeClassName="active" to={`${path}${debateData.slug}/debate`} onClick={this.displayMenu}>
                  <Translate value="navbar.debate" />
                </Link>
                <Link className="navbar-menu-item" activeClassName="active" to={`${path}${debateData.slug}/community`} onClick={this.displayMenu}>
                  <Translate value="navbar.community" />
                </Link>
                <div className="burgermenu-language center">
                  <LanguageMenu size="xl" />
                </div>
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
    debate: state.debate,
    path: state.path
  };
};

export default connect(mapStateToProps)(NavBar);