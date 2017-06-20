import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Link, browserHistory } from 'react-router';

import { getPermissionsForConnectedUser } from '../../reducers/usersReducer';
import { connectedUserIsAdmin } from '../../utils/permissions';
import { get } from '../../utils/routeMap';
import { displayModal } from '../../utils/utilityManager';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { getCurrentPhaseIdentifier, getPhaseName, isSeveralIdentifiers } from '../../utils/timeline';

class NavigationMenu extends React.Component {
  constructor(props) {
    super(props);
    this.displayPhase = this.displayPhase.bind(this);
  }
  // This redirection should be removed when the phase 2 will be done
  displayPhase() {
    const slug = { slug: getDiscussionSlug() };
    const { isRedirectionToV1 } = this.props.phase;
    const { timeline } = this.props.debate.debateData;
    const { locale } = this.props.i18n;
    const currentPhaseIdentifier = getCurrentPhaseIdentifier(timeline);
    const phaseName = getPhaseName(timeline, currentPhaseIdentifier, locale).toLowerCase();
    const body = <Translate value="redirectToV1" phaseName={phaseName} />;
    const button = { link: `${get('oldDebate', slug)}`, label: I18n.t('home.accessButton'), internalLink: false };
    const isSeveralPhases = isSeveralIdentifiers(timeline);
    if (isRedirectionToV1) {
      if (isSeveralPhases) {
        displayModal(null, body, true, null, button, true);
        setTimeout(() => {
          window.location = `${get('oldDebate', slug)}`;
        }, 6000);
      } else {
        window.location = `${get('oldDebate', slug)}`;
      }
    } else {
      browserHistory.push(`${get('debate', slug)}`);
    }
  }
  render() {
    const { debateData } = this.props.debate;
    const { isAdmin } = this.props;
    return (
      <div>
        <Link onClick={this.displayPhase} className="navbar-menu-item pointer" activeClassName="active">
          <Translate value="navbar.debate" />
        </Link>
        {isAdmin &&
          <Link to={get('administration', { slug: debateData.slug })} className="navbar-menu-item pointer" activeClassName="active">
            <Translate value="navbar.administration" />
          </Link>
        }
        {false &&
          <Link className="navbar-menu-item" activeClassName="active" to={get('community', { slug: debateData.slug })}>
            <Translate value="navbar.community" />
          </Link>
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const permissions = getPermissionsForConnectedUser(state);
  return {
    isAdmin: connectedUserIsAdmin(permissions),
    debate: state.debate,
    phase: state.phase,
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(NavigationMenu);