import React from 'react';
import { browserHistory, Link } from 'react-router';
import { connect } from 'react-redux';
import { Grid, Navbar } from 'react-bootstrap';
import { getCurrentPhaseIdentifier } from '../../utils/timeline';
import Avatar from './avatar';
import LanguageMenu from './languageMenu';
import NavigationMenu from './navigationMenu';
import { get } from '../../utils/routeMap';
import { getConnectedUserId } from '../../utils/globalFunctions';
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
    this.setState({ isMenuHidden: !isMenuHidden });
  }
  render() {
    const { debateData } = this.props.debate;
    const currentPhaseIdentifier = getCurrentPhaseIdentifier(debateData.timeline);
    const slug = { slug: debateData.slug };
    const connectedUserId = getConnectedUserId();
    const { isHidden } = this.props;
    return (
      <Grid fluid className={isHidden ? 'hiddenNavbar' : 'shown'}>
        <Navbar fixedTop fluid>
          <div className="nav-bar max-container" id="navbar">
            <div className="burgermenu-icon left" onClick={this.displayMenu}>
              <div className={this.state.isMenuHidden ? 'shown' : 'hidden'}>
                <span className="assembl-icon-menu-on black">&nbsp;</span>
              </div>
              <div className={this.state.isMenuHidden ? 'hidden' : 'shown'}>
                <span className="assembl-icon-cancel black">&nbsp;</span>
              </div>
            </div>
            <div className="navbar-logo left">
              <Link to={`${get('home', slug)}`} activeClassName="logo-active">
                <img src={debateData.logo} alt="logo" />
              </Link>
            </div>
            <div className="nav-menu left">
              <NavigationMenu />
            </div>
            <div className="navbar-icons right">
              {currentPhaseIdentifier !== 'survey'
                ? <div id="search" className="left">
                  <Search />
                </div>
                : null}
              {connectedUserId &&
                debateData.helpUrl &&
                <Link to={`${debateData.helpUrl}`} target="_blank">
                  <span className="assembl-icon-faq grey">&nbsp;</span>
                </Link>}
              <div className="navbar-language right">
                <LanguageMenu size="xs" />
              </div>
              <Avatar location={this.props.location} />
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

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(NavBar);