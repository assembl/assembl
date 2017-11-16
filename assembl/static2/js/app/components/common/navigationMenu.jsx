import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';
import { Link } from 'react-router';

import { connectedUserIsAdmin } from '../../utils/permissions';
import { get } from '../../utils/routeMap';
import { displayModal } from '../../utils/utilityManager';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { getCurrentPhaseIdentifier, getPhaseName, isSeveralIdentifiers } from '../../utils/timeline';
import ResourcesCenter from '../../graphql/ResourcesCenter.graphql';

class NavigationMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phaseContext: ''
    };
    this.displayModal = this.displayModal.bind(this);
  }
  componentWillMount() {
    const { isRedirectionToV1 } = this.props.phase;
    const { timeline } = this.props.debate.debateData;
    const isSeveralPhases = isSeveralIdentifiers(timeline);
    if (isRedirectionToV1) {
      if (isSeveralPhases) {
        this.setState({
          phaseContext: 'modal'
        });
      } else {
        this.setState({
          phaseContext: 'old'
        });
      }
    } else {
      this.setState({
        phaseContext: 'new'
      });
    }
  }
  // This redirection should be removed when the phase 2 will be done
  displayModal() {
    const slug = { slug: getDiscussionSlug() };
    const { timeline } = this.props.debate.debateData;
    const { locale } = this.props.i18n;
    const currentPhaseIdentifier = getCurrentPhaseIdentifier(timeline);
    const phaseName = getPhaseName(timeline, currentPhaseIdentifier, locale).toLowerCase();
    const body = <Translate value="redirectToV1" phaseName={phaseName} />;
    const button = { link: get('oldDebate', slug), label: I18n.t('home.accessButton'), internalLink: false };
    displayModal(null, body, true, null, button, true);
    setTimeout(() => {
      window.location = get('oldDebate', slug);
    }, 6000);
  }
  render() {
    const { debateData } = this.props.debate;
    const { isAdmin } = this.props;
    const hasResourcesCenter = this.props.data.hasResourcesCenter;
    const slug = { slug: getDiscussionSlug() };
    const currentPhaseIdentifier = getCurrentPhaseIdentifier(debateData.timeline);
    return (
      <div>
        {this.state.phaseContext === 'modal'
          ? <Link onClick={this.displayModal} className="navbar-menu-item pointer">
            <Translate value="navbar.debate" />
          </Link>
          : null}
        {this.state.phaseContext === 'old'
          ? <a className="navbar-menu-item pointer" href={get('oldDebate', slug)}>
            <Translate value="navbar.debate" />
          </a>
          : null}
        {this.state.phaseContext === 'new'
          ? <Link
            to={get('debate', { ...slug, phase: currentPhaseIdentifier })}
            className="navbar-menu-item pointer"
            activeClassName="active"
          >
            <Translate value="navbar.debate" />
          </Link>
          : null}
        {isAdmin &&
          <Link
            to={get('administration', { slug: debateData.slug })}
            className="navbar-menu-item pointer"
            activeClassName="active"
          >
            <Translate value="navbar.administration" />
          </Link>}
        {hasResourcesCenter &&
          <Link
            to={get('resourcesCenter', { slug: debateData.slug })}
            className="navbar-menu-item pointer"
            activeClassName="active"
          >
            <Translate value="navbar.resourcesCenter" />
          </Link>}
        {false &&
          <Link className="navbar-menu-item" activeClassName="active" to={get('community', { slug: debateData.slug })}>
            <Translate value="navbar.community" />
          </Link>}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    isAdmin: connectedUserIsAdmin(),
    debate: state.debate,
    phase: state.phase,
    i18n: state.i18n
  };
};

export default compose(connect(mapStateToProps), graphql(ResourcesCenter))(NavigationMenu);