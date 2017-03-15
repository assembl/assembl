import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import Loader from './loader';

class ProfileIcon extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { users, usersLoading, usersError } = this.props.users;
    const { rootPath, connectedUserId } = this.props.context;
    return (
      <div className="right avatar">
        {!connectedUserId &&
          <Link to={`${rootPath}${debateData.slug}/login?next=${rootPath}${debateData.slug}/home`}>
            <span className="connection">
              <Translate value="navbar.connexion" />
            </span>
          </Link>
        }
        {connectedUserId &&
          <div>
            {usersLoading && <Loader textHidden color="black" />}
            {users &&
              <div>
                <span className="assembl-icon-profil grey">&nbsp;</span>
                <DropdownButton bsStyle="link" title={users.connectedUser.username ? users.connectedUser.username : users.connectedUser.name} id="user-dropdown">
                  <LinkContainer to={`${rootPath}${debateData.slug}/profile/${users.connectedUser.name}`}>
                    <MenuItem>Profile</MenuItem>
                  </LinkContainer>
                  <MenuItem href={`/logout?next=${rootPath}${debateData.slug}/home`}>Log out</MenuItem>
                </DropdownButton>
              </div>
            }
            {usersError &&
              <span className="connection"><Translate value="navbar.connexion" /></span>
            }
          </div>
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    users: state.users,
    context: state.context
  };
};

export default connect(mapStateToProps)(ProfileIcon);