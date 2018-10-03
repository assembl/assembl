import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { NavDropdown, MenuItem } from 'react-bootstrap';

import { getContextual, get } from '../../utils/routeMap';
import UserQuery from '../../graphql/userQuery.graphql';
import manageErrorAndLoading from './manageErrorAndLoading';
import { browserHistory } from '../../router';
import { localAwareLink } from '../../utils/utilityManager';

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
    const { slug, connectedUserId, loginData } = this.props;
    let loginUrl = `${getContextual('login', { slug: slug })}?next=${this.state.next}`;
    if (loginData && loginData.url) {
      loginUrl = loginData.url.includes('?')
        ? `${loginData.url}&next=${this.state.next}`
        : `${loginData.url}?next=${this.state.next}`;
    }
    const dropdownUser = (
      <div className="inline">
        <span className="assembl-icon-profil grey" />
        <span className="user-account">
          <Translate value="profile.panelTitle" />
        </span>
      </div>
    );
    const LoginAnchor = () => (
      <div className="connection">
        <Translate value="navbar.connection" />
      </div>
    );
    const LocalAwareAnchor = localAwareLink(LoginAnchor);
    const urlData = { url: loginUrl, local: loginData.local };
    return (
      <div className="right avatar">
        {!connectedUserId && loginUrl && <LocalAwareAnchor urlData={urlData} />}
        {connectedUserId && (
          <ul className="dropdown-xs">
            <NavDropdown pullRight title={dropdownUser} id="user-dropdown">
              <MenuItem
                onClick={() => {
                  browserHistory.push(get('profile', { slug: slug, userId: connectedUserId }));
                }}
              >
                <Translate value="profile.panelTitle" />
              </MenuItem>
              <MenuItem href={`${getContextual('oldLogout', { slug: slug })}?next=${get('home', { slug: slug })}`}>
                <Translate value="navbar.logout" />
              </MenuItem>
            </NavDropdown>
          </ul>
        )}
      </div>
    );
  }
}

const mapStateToProps = ({ context, debate }) => ({
  slug: debate.debateData.slug,
  connectedUserId: context.connectedUserId,
  id: context.connectedUserIdBase64
});

export default compose(
  connect(mapStateToProps),
  graphql(UserQuery, {
    skip: props => !props.id,
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        displayName: data.user.displayName
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: false })
)(ProfileIcon);