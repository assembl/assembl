import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import MapStateToProps from '../../store/mapStateToProps';
import MapDispatchToProps from '../../store/mapDispatchToProps';

class ProfileIcon extends React.Component {
  componentWillMount() {
    // const { connectedUserId } = this.props.context;
    // console.log(connectedUserId);
  }
  render() {
    const { rootPath, connectedUserId } = this.props.context;
    return (
      <div className="right profile-icon">
        {!connectedUserId &&
          <span className="username">Connexion</span>
        }
        {connectedUserId &&
          <Link to={`${rootPath}profile/${connectedUserId}`}>
            <img src="../../../../static2/img/default_avatar.png" alt="avatar" />
            <span className="username">User name</span>
          </Link>
        }
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(ProfileIcon);