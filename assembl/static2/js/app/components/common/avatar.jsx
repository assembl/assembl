import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link, browserHistory } from 'react-router';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import { getContextual, get } from '../../utils/routeMap';
import { getConnectedUserName, getConnectedUserId, getDiscussionSlug } from '../../utils/globalFunctions';

class ProfileIcon extends React.Component {
  constructor(props) {
    super(props);
    this.setCurrentView = this.setCurrentView.bind(this);
  }
  componentWillMount() {
    this.setCurrentView();
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.location) {
      this.setState({ next: nextProps.location });
    }
  }
  setCurrentView() {
    const { location } = this.props;
    this.setState({
      next: location
    });
  }
  render() {
    const slug = { slug: getDiscussionSlug() };
    const connectedUserId = getConnectedUserId();
    const connectedUserName = getConnectedUserName();
    const dropdownUser = (
      <div className="inline">
        <span className="assembl-icon-profil grey">&nbsp;</span>
        <span className="username">{connectedUserName}</span>
      </div>
    );
    return (
      <div className="right avatar">
        {!connectedUserId && (
          <Link to={`${getContextual('login', slug)}?next=${this.state.next}`}>
            <div className="connection">
              <Translate value="navbar.connection" />
            </div>
          </Link>
        )}
        {connectedUserId &&
          connectedUserName && (
            <div>
              <ul className="dropdown-xs">
                <NavDropdown pullRight title={dropdownUser} id="user-dropdown">
                  <MenuItem
                    onClick={() => {
                      browserHistory.push(get('profile', { ...slug, userId: connectedUserId }));
                    }}
                  >
                    <Translate value="navbar.profile" />
                  </MenuItem>
                  <MenuItem href={`${getContextual('oldLogout', slug)}?next=${get('home', slug)}`}>
                    <Translate value="navbar.logout" />
                  </MenuItem>
                </NavDropdown>
              </ul>
            </div>
          )}
      </div>
    );
  }
}

export default ProfileIcon;