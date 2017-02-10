import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { Glyphicon } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';
import MapDispatchToProps from '../../store/mapDispatchToProps';
import Loader from './loader';

class ProfileIcon extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { users, usersLoading, usersError } = this.props.users;
    const { rootPath, connectedUserId } = this.props.context;
    return (
      <div className="right profile-icon">
        {!connectedUserId &&
          <Link to={`${rootPath}${debateData.slug}/login`}>
            <span className="connection"><Translate value="navbar.connexion" /></span>
          </Link>
        }
        {connectedUserId &&
          <div>
            {usersLoading && <Loader textHidden />}
            {users &&
              <Link to={`${rootPath}profile/${users.connectedUser.name}`}>
                <div className="rounded-icon"><Glyphicon glyph="user" /></div>
                <span className="username">{users.connectedUser.username ? users.connectedUser.username : users.connectedUser.name}</span>
              </Link>
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

export default connect(MapStateToProps, MapDispatchToProps)(ProfileIcon);