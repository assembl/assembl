import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import MapStateToProps from '../../store/mapStateToProps';
import MapDispatchToProps from '../../store/mapDispatchToProps';
import Loader from './loader';

class ProfileIcon extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath, connectedUserId } = this.props.context;
    const { users, usersLoading, usersError } = this.props.users;
    return (
      <div className="right profile-icon">
        {!connectedUserId &&
          <Link to={`${rootPath}${debateData.slug}/login`}>
            <span className="username"><Translate value="navbar.connexion" /></span>
          </Link>
        }
        {connectedUserId &&
          <span>
            {usersLoading && <Loader textHidden />}
            {users &&
              <Link to={`${rootPath}profile/${connectedUserId}`}>
                <img src="../../../../static2/img/default_avatar.png" alt="avatar" />
                <span className="username">{users.connectedUser.username}</span>
              </Link>
            }
            {usersError &&
              <span className="username"><Translate value="navbar.connexion" /></span>
            }
          </span>
        }
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(ProfileIcon);