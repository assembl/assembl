import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

class NavigationMenu extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { path } = this.props;
    return (
      <div>
        <Link className="navbar-menu-item" activeClassName="active" to={`${path}${debateData.slug}/home`}>
          <Translate value="navbar.home" />
        </Link>
        <Link className="navbar-menu-item" activeClassName="active" to={`${path}${debateData.slug}/debate`}>
          <Translate value="navbar.debate" />
        </Link>
        <Link className="navbar-menu-item" activeClassName="active" to={`${path}${debateData.slug}/community`}>
          <Translate value="navbar.community" />
        </Link>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    path: state.path
  };
};

export default connect(mapStateToProps)(NavigationMenu);