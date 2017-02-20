import React from 'react';
import { browserHistory, Link } from 'react-router';
import { connect } from 'react-redux';
import { Grid, Navbar } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';
import Avatar from './avatar';
import LanguageMenu from './languageMenu';
import NavigationMenu from './navigationMenu';
import Search from '../search';

class NavBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuHidden: true
    };
    this.displayMenu = this.displayMenu.bind(this);
  }
  componentWillMount() {
    this.unlisten = browserHistory.listen(() => {
      this.setState({ isMenuHidden: true });
    });
  }
  componentWillReceiveProps() {
    this.setState({ isMenuHidden: true });
  }
  componentWillUnmount() {
    this.unlisten();
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
              <div className={this.state.isMenuHidden ? 'shown' : 'hidden'}>
                <span className="icon-menu-on black">&nbsp;</span>
              </div>
              <div className={this.state.isMenuHidden ? 'hidden' : 'shown'}>
                <span className="icon-cancel black">&nbsp;</span>
              </div>
            </div>
            <div className="navbar-logo left">
              <Link to={`${rootPath}${debateData.slug}/home`} activeClassName="logo-active">
                <img src={debateData.logo} alt="logo" />
              </Link>
            </div>
            <div className="nav-menu left">
              <NavigationMenu />
            </div>
            <div className="">
              <Search />
            </div>
            <div className="navbar-icons right">
              <Link to={`${debateData.help_url}`} target="_blank">
                <span className="icon-faq grey">&nbsp;</span>
              </Link>
              <div className="navbar-language right">
                <LanguageMenu size="xs" />
              </div>
              <Avatar />
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
