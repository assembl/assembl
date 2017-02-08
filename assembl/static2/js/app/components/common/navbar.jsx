import React from 'react';
import { browserHistory, Link } from 'react-router';
import { connect } from 'react-redux';
import { Grid, Navbar, Glyphicon } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';
import ProfileIcon from './profileIcon';
import LanguageMenu from './languageMenu';
import NavigationMenu from './navigationMenu';

class NavBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuHidden: true
    };
    this.displayMenu = this.displayMenu.bind(this);
    browserHistory.listen(() => {
      this.setState({ isMenuHidden: true });
    });
  }
  componentWillReceiveProps() {
    this.setState({ isMenuHidden: true });
  }
  displayMenu() {
    const { isMenuHidden } = this.state;
    if (!isMenuHidden) this.setState({ isMenuHidden: true });
    if (isMenuHidden) this.setState({ isMenuHidden: false });
  }
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    return (
      <Grid fluid>
        <Navbar fixedTop fluid>
          <div className="nav-bar max-container">
            <div className="burgermenu-icon left" onClick={this.displayMenu}>
              <div className={this.state.isMenuHidden ? 'black-icon shown' : 'black-icon hidden'}><Glyphicon glyph="align-justify" /></div>
              <div className={this.state.isMenuHidden ? 'black-icon hidden' : 'black-icon shown'}><Glyphicon glyph="remove" /></div>
            </div>
            <div className="navbar-logo left">
              <Link to={`${rootPath}${debateData.slug}/home`}>
                <img src={debateData.logo} alt="logo" />
              </Link>
            </div>
            <div className="nav-menu left">
              <NavigationMenu />
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
              <NavigationMenu />
              <div className="burgermenu-language center">
                <LanguageMenu size="xl" />
              </div>
            </div>
          </div>
        </Navbar>
      </Grid>
    );
  }
}

export default connect(MapStateToProps)(NavBar);