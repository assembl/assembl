import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { Navbar } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import { I18n, Translate } from 'react-redux-i18n';

import { getCurrentPhaseIdentifier, isSeveralIdentifiers, getPhaseName } from '../../utils/timeline';
import { get } from '../../utils/routeMap';
import { withScreenWidth } from './screenDimensions';
import { connectedUserIsAdmin } from '../../utils/permissions';
import SectionsQuery from '../../graphql/SectionsQuery.graphql';
import FlatNavbar from '../navbar/FlatNavbar';
import BurgerNavbar from '../navbar/BurgerNavbar';
import { APP_CONTAINER_MAX_WIDTH, APP_CONTAINER_PADDING } from '../../constants';
import { displayModal } from '../../utils/utilityManager';
import { getDiscussionSlug } from '../../utils/globalFunctions';

const filterSection = ({ sectionType }, { hasResourcesCenter, hasSyntheses }) => {
  switch (sectionType) {
  case 'RESOURCES_CENTER':
    return hasResourcesCenter;
  case 'SYNTHESES':
    return hasSyntheses;
  case 'ADMINISTRATION':
    return connectedUserIsAdmin();
  case 'HOMEPAGE':
    return false;
  default:
    return true;
  }
};

const sectionFilter = (options = {}) => {
  return (section) => {
    return filterSection(section, options);
  };
};

const sectionKey = ({ sectionType, url }) => {
  return sectionType === 'CUSTOM' ? `${sectionType}-${url}` : sectionType;
};

const constantToCamelCase = (string) => {
  return string.toLowerCase().replace(/_[a-z]/g, (match) => {
    return match[1].toUpperCase();
  });
};

const sectionSlug = (sectionType) => {
  return constantToCamelCase(sectionType === 'HOMEPAGE' ? 'HOME' : sectionType);
};

const sectionURL = ({ sectionType, url }, slug, phaseIdentifier) => {
  return url || `${get(sectionSlug(sectionType), { slug: slug, phase: phaseIdentifier })}`;
};

const SectionLink = ({ section, options: { slug, currentPhaseIdentifier } }) => {
  const { title } = section;
  return (
    <Link
      to={sectionURL(section, slug, currentPhaseIdentifier)}
      className="navbar-menu-item pointer"
      activeClassName="active"
      data-text={title}
    >
      {title}
    </Link>
  );
};

const createDisplayModal = ({ debate, i18n }) => {
  return () => {
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
        {title}{' '}
      </a>
    );
  default:
    return <SectionLink key={key} section={debateSection} options={options} />;
  }
};

const mapSectionToElement = (section, options) => {
  switch (section.sectionType) {
  case 'DEBATE':
    return mapDebateSectionToElement(section, options);
  default:
    return <SectionLink key={sectionKey(section)} section={section} options={options} />;
  }
};

const sectionMapper = (options) => {
  return (section) => {
    return mapSectionToElement(section, options);
  };
};

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

class AssemblNavbar extends React.PureComponent {
  setFlatWidth = (newWidth) => {
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
    const filteredSections = sections.filter(sectionFilter(data));
    const mapOptions = {
      slug: slug,
      currentPhaseIdentifier: getCurrentPhaseIdentifier(timeline),
      phaseContext: phaseContext(timeline, phase),
      displayDebateModal: createDisplayModal({ debate: debate, i18n: i18n })
    };
    const commonProps = {
      elements: filteredSections.map(sectionMapper(mapOptions)),
      slug: slug,
      logoSrc: logo,
      helpUrl: helpUrl,
      location: location
    };
    return (
      <div className="background-light">
        <Navbar fixedTop fluid>
          <div className="nav-bar max-container" id="navbar">
            {screenTooSmall && <BurgerNavbar {...commonProps} />}
            <FlatNavbar
              {...commonProps}
              setWidth={this.setFlatWidth}
              style={screenTooSmall && { opacity: 0, position: 'absolute', top: '-200px' }}
            />
          </div>
        </Navbar>
      </div>
    );
  };
}

export default compose(
  connect((state) => {
    return {
      debate: state.debate,
      phase: state.phase,
      i18n: state.i18n
    };
  }),
  graphql(SectionsQuery),
  withScreenWidth
)(AssemblNavbar);