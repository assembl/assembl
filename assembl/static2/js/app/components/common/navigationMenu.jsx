import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import MapStateToProps from '../../store/mapStateToProps';

class NavigationMenu extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    return (
      <div>
        <Link className="navbar-menu-item" activeClassName="active" to={`${rootPath}${debateData.slug}/home`}>
          <Translate value="navbar.home" />
        </Link>
        <Link className="navbar-menu-item" activeClassName="active" to={`${rootPath}${debateData.slug}/debate`}>
          <Translate value="navbar.debate" />
        </Link>
        <Link className="navbar-menu-item" activeClassName="active" to={`${rootPath}${debateData.slug}/community`}>
          <Translate value="navbar.community" />
        </Link>
      </div>
    );
  }
}

export default connect(MapStateToProps)(NavigationMenu);