import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import { getContextual, get } from '../../utils/routeMap';
import { getConnectedUserName, getConnectedUserId, getDiscussionSlug } from '../../utils/globalFunctions';

class ProfileIcon extends React.Component {
  constructor(props) {
    super(props);
    this.setCurrentView = this.setCurrentView.bind(this);
  }
  setCurrentView() {
    const { location } = this.props;
    this.setState({
      next: location
    });
  }
  componentWillMount() {
    this.setCurrentView();
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.location) {
      this.setState({ next: nextProps.location });
    }
  }

  render() {
    const slug = { slug: getDiscussionSlug() };
    const connectedUserId = getConnectedUserId();
    const connectedUserName = getConnectedUserName();
    return (
      <div className="right avatar">
        {!connectedUserId &&
          <Link to={`${getContextual('login', slug)}?next=${this.state.next}`}>
            <div className="connection">
              <Translate value="navbar.connection" />
            </div>
          </Link>
        }
        {connectedUserId && connectedUserName &&
          <div>
            <span className="assembl-icon-profil grey">&nbsp;</span>
            <ul className="dropdown-xs">
              <NavDropdown title={connectedUserName} id="user-dropdown">
                <LinkContainer active={false} to={`${get('profile', { ...slug, userId: connectedUserId })}`}>
                  <MenuItem>
                    <Translate value="navbar.profile" />
                  </MenuItem>
                </LinkContainer>
                <MenuItem href={`${getContextual('oldLogout', slug)}?next=${get('home', slug)}`}>
                  <Translate value="navbar.logout" />
                </MenuItem>
              </NavDropdown>
            </ul>
          </div>
        }
      </div>
    );
  }
}

export default ProfileIcon;