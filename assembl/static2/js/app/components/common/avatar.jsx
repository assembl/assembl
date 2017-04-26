import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';
import { NavDropdown, MenuItem } from 'react-bootstrap';
import Routes from '../../utils/routeMap';

class ProfileIcon extends React.Component {
  constructor(props) {
    super(props);
    const next = Routes.getCurrentView();
    this.state = {
      next: next
    };
    this.getCurrentView = this.getCurrentView.bind(this);
  }
  getCurrentView() {
    const next = Routes.getCurrentView();
    this.setState({
      next: next
    });
  }
  render() {
    const { debateData } = this.props.debate;
    const slug = { slug: debateData.slug };
    const { connectedUserId, connectedUserName } = this.props.context;
    return (
      <div className="right avatar">
        {!connectedUserId &&
          <Link onMouseOver={this.getCurrentView} to={`${Routes.getContextual('login', slug)}?next=${this.state.next}`}>
            <div className="connection">
              <Translate value="navbar.connexion" />
            </div>
          </Link>
        }
        {connectedUserId && connectedUserName &&
          <div>
            <span className="assembl-icon-profil grey">&nbsp;</span>
            <ul className="dropdown-xs">
              <NavDropdown title={connectedUserName} id="user-dropdown">
                <LinkContainer active={false} to={`${Routes.get('profile', { ...slug, userId: connectedUserId })}`}>
                  <MenuItem>
                    <Translate value="navbar.profile" />
                  </MenuItem>
                </LinkContainer>
                <MenuItem href={`${Routes.getContextual('oldLogout', slug)}?next=${Routes.get('home', slug)}`}>
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

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context
  };
};

export default connect(mapStateToProps)(ProfileIcon);