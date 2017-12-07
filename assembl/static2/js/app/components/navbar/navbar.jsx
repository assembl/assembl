// @flow

import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { Navbar } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import { I18n, Translate } from 'react-redux-i18n';
import bind from 'lodash/bind';

import { getCurrentPhaseIdentifier, isSeveralIdentifiers, getPhaseName } from '../../utils/timeline';
import { get } from '../../utils/routeMap';
import { withScreenWidth } from '../common/screenDimensions';
import { connectedUserIsAdmin } from '../../utils/permissions';
import SectionsQuery from '../../graphql/SectionsQuery.graphql';
import FlatNavbar from './FlatNavbar';
import BurgerNavbar from './BurgerNavbar';
import { APP_CONTAINER_MAX_WIDTH, APP_CONTAINER_PADDING } from '../../constants';
import { displayModal } from '../../utils/utilityManager';
import { getDiscussionSlug, snakeToCamel } from '../../utils/globalFunctions';

const filterSection = ({ sectionType }, { hasResourcesCenter, hasSyntheses }) => {
  switch (sectionType) {
  case 'RESOURCES_CENTER':
    return hasResourcesCenter;
  case 'SYNTHESES':
    return hasSyntheses;
  case 'ADMINISTRATION':
    return connectedUserIsAdmin();
  case 'HOMEPAGE':
    // The homepage button is the logo at the top left and it is renderered separately
    return false;
  default:
    return true;
  }
};

const sectionFilter = (options = {}) => section => filterSection(section, options);

const sectionKey = ({ sectionType, id }) => (sectionType === 'CUSTOM' ? `${sectionType}-${id}` : sectionType);

const sectionSlug = sectionType => snakeToCamel(sectionType === 'HOMEPAGE' ? 'HOME' : sectionType);

const sectionURL = ({ sectionType, url }, options) =>
  (sectionType === 'CUSTOM' ? url : url || `${get(sectionSlug(sectionType), options)}`);

const SectionLink = ({ section, options }) => {
  const { title, url, sectionType } = section;
  return url || sectionType === 'CUSTOM' ? (
    <a href={url} target="_blank" className="navbar-menu-item pointer" data-text={title}>
      {title}
    </a>
  ) : (
    <Link to={sectionURL(section, options)} className="navbar-menu-item pointer" activeClassName="active" data-text={title}>
      {title}
    </Link>
  );
};
SectionLink.displayName = 'SectionLink';

const createDisplayModal = ({ debate, i18n }) => () => {
  const slug = { slug: getDiscussionSlug() };
  const { timeline } = debate.debateData;
  const { locale } = i18n;
  const currentPhaseIdentifier = getCurrentPhaseIdentifier(timeline);
  const phaseName = getPhaseName(timeline, currentPhaseIdentifier, locale).toLowerCase();
  const body = <Translate value="redirectToV1" phaseName={phaseName} />;
  const button = { link: get('oldDebate', slug), label: I18n.t('home.accessButton'), internalLink: false };
  displayModal(null, body, true, null, button, true);
  setTimeout(() => {
    window.location = get('oldDebate', slug);
  }, 6000);
};

const mapDebateSectionToElement = (debateSection, options) => {
  const { title } = debateSection;
  const { phaseContext, displayDebateModal } = options;
  const key = sectionKey(debateSection);
  switch (phaseContext) {
  case 'modal':
    return (
      <div key={key} onClick={displayDebateModal} className="navbar-menu-item pointer" data-text={title}>
        {title}
      </div>
    );
  case 'old':
    return (
      <a key={key} className="navbar-menu-item pointer" href={get('oldDebate', { slug: options.slug })} data-text={title}>
        {title}
      </a>
    );
  default:
    return <SectionLink key={key} section={debateSection} options={options} />;
  }
};

type MapSectionOptions = {
  phase: string,
  phaseContext: string,
  displayDebateModal: () => mixed,
  slug: string
};

type Section = {
  id: string,
  sectionType: string,
  url: string,
  title: string
};

export const mapSectionToElement = (section: Section, options: MapSectionOptions) =>
  (section.sectionType === 'DEBATE' ? (
    mapDebateSectionToElement(section, options)
  ) : (
    <SectionLink key={sectionKey(section)} section={section} options={options} />
  ));

const phaseContext = (timeline, phase) => {
  const isSeveralPhases = isSeveralIdentifiers(timeline);
  if (phase.isRedirectionToV1) {
    if (isSeveralPhases) {
      return 'modal';
    }
    return 'old';
  }
  return 'new';
};

export class AssemblNavbar extends React.PureComponent {
  state: {
    flatWidth: number
  };

  setFlatWidth = (newWidth: number) => {
    this.setState({ flatWidth: newWidth });
  };

  render = () => {
    const { screenWidth, debate, data, location, phase, i18n } = this.props;
    const sections = (data && data.sections) || [];
    const { debateData } = debate;
    const { timeline, logo, slug, helpUrl } = debateData;
    const flatWidth = (this.state && this.state.flatWidth) || 0;
    const maxAppWidth = Math.min(APP_CONTAINER_MAX_WIDTH, screenWidth) - APP_CONTAINER_PADDING * 2;
    const screenTooSmall = flatWidth > maxAppWidth;
    const filteredSections = sections.filter(sectionFilter(data)).sort((a, b) => a.order - b.order);
    const mapOptions = {
      slug: slug,
      phase: getCurrentPhaseIdentifier(timeline),
      phaseContext: phaseContext(timeline, phase),
      displayDebateModal: createDisplayModal({ debate: debate, i18n: i18n })
    };
    const commonProps = {
      elements: filteredSections.map(bind(mapSectionToElement, null, bind.placeholder, mapOptions)),
      slug: slug,
      logoSrc: logo,
      helpUrl: helpUrl,
      location: location,
      logoLink: sections.length > 0 && sections.find(section => section && section.sectionType === 'HOMEPAGE').url
    };
    return (
      <div className="background-light">
        <Navbar fixedTop fluid>
          <div className="nav-bar max-container" id="navbar">
            {screenTooSmall && <BurgerNavbar {...commonProps} />}
            <FlatNavbar
              {...commonProps}
              setWidth={this.setFlatWidth}
              style={screenTooSmall ? { opacity: 0, position: 'absolute', top: '-200px' } : {}}
            />
          </div>
        </Navbar>
      </div>
    );
  };
}

export default compose(
  connect(state => ({
    debate: state.debate,
    phase: state.phase,
    i18n: state.i18n
  })),
  graphql(SectionsQuery),
  withScreenWidth
)(AssemblNavbar);