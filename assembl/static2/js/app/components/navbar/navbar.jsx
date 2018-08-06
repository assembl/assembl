// @noflow

import * as React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { Navbar } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import bind from 'lodash/bind';

import { getCurrentPhaseIdentifier } from '../../utils/timeline';
import { get } from '../../utils/routeMap';
import { withScreenWidth } from '../common/screenDimensions';
import { connectedUserIsAdmin } from '../../utils/permissions';
import SectionsQuery from '../../graphql/SectionsQuery.graphql';
import FlatNavbar from './FlatNavbar';
import BurgerNavbar from './BurgerNavbar';
import { APP_CONTAINER_MAX_WIDTH, APP_CONTAINER_PADDING } from '../../constants';
import { snakeToCamel } from '../../utils/globalFunctions';
import withoutLoadingIndicator from '../common/withoutLoadingIndicator';
import DebateLink from '../debate/navigation/debateLink';
import Logo from './Logo';
import UserMenu from './UserMenu';

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

const sectionURL = ({ sectionType, url }, options) => {
  if (sectionType === 'ADMINISTRATION') {
    const defaultAdminPhase = 'discussion';
    return `${get(sectionSlug(sectionType), options)}${get('adminPhase', {
      ...options,
      phase: defaultAdminPhase
    })}?section=1`;
  }

  // url may be defined for non-custom sections (i.e. HOMEPAGE section)
  return sectionType === 'CUSTOM' ? url : url || get(sectionSlug(sectionType), options);
};

const SectionLink = ({ section, options }) => {
  const { title, url, sectionType } = section;
  if (url || sectionType === 'CUSTOM') {
    return (
      <a href={url} className="navbar-menu-item pointer" data-text={title}>
        {title}
      </a>
    );
  }
  const sectionName = sectionType.toLowerCase().replace('_', '');
  const isActiveUrl = location.pathname
    .split('/')
    .slice(2)
    .join('/')
    .includes(sectionName);
  const linkClassNames = isActiveUrl ? 'navbar-menu-item pointer active' : 'navbar-menu-item pointer';
  return sectionType === 'DEBATE' ? (
    <DebateLink
      to={sectionURL(section, options)}
      identifier={options.phase}
      className={linkClassNames}
      dataText={title}
      screenTooSmall={options.screenTooSmall}
    >
      {title}
    </DebateLink>
  ) : (
    <Link to={sectionURL(section, options)} className={linkClassNames} data-text={title}>
      {title}
    </Link>
  );
};
SectionLink.displayName = 'SectionLink';

type MapSectionOptions = {
  phase: string,
  phaseContext: string,
  slug: string,
  screenTooSmall: boolean
};

type Section = {
  id: string,
  sectionType: string,
  url: string,
  title: string
};

export const mapSectionToElement = (section: Section, options: MapSectionOptions) =>
  (section.sectionType === 'DEBATE' ? (
    <SectionLink key={sectionKey(section)} section={section} options={options} />
  ) : (
    <SectionLink key={sectionKey(section)} section={section} options={options} />
  ));

const phaseContext = () => 'new';

type AssemblNavbarProps = {};

type AssemblNavbarState = {
  flatWidth: number
};

export class AssemblNavbar extends React.PureComponent<AssemblNavbarProps, AssemblNavbarState> {
  setFlatWidth = (newWidth: number) => {
    this.setState({ flatWidth: newWidth });
  };

  renderUserMenu = (remainingWidth: number) => {
    const { debate: { debateData: { helpUrl } }, location } = this.props;
    return <UserMenu helpUrl={helpUrl} location={location} remainingWidth={remainingWidth} />;
  };

  render = () => {
    const { screenWidth, debate, data, phase, timeline } = this.props;
    const sections = data.sections;
    const { debateData } = debate;
    const { logo, slug, isLargeLogo } = debateData;
    const flatWidth = (this.state && this.state.flatWidth) || 0;
    const maxAppWidth = Math.min(APP_CONTAINER_MAX_WIDTH, screenWidth) - APP_CONTAINER_PADDING * 2;
    const screenTooSmall = flatWidth > maxAppWidth;
    const filteredSections = sections.filter(sectionFilter(data)).sort((a, b) => a.order - b.order);
    const mapOptions = {
      slug: slug,
      phase: getCurrentPhaseIdentifier(timeline),
      phaseContext: phaseContext(timeline, phase),
      screenTooSmall: screenTooSmall
    };
    const commonProps = {
      elements: filteredSections.map(bind(mapSectionToElement, null, bind.placeholder, mapOptions)),
      slug: slug,
      logoSrc: logo,
      logoLink: sections.length > 0 ? sections.find(section => section && section.sectionType === 'HOMEPAGE').url : '',
      renderUserMenu: this.renderUserMenu
    };
    return (
      <div className="background-light">
        <Navbar fixedTop fluid className="no-padding">
          {isLargeLogo &&
            !screenTooSmall && (
              <div className="large-logo max-container">
                <Logo slug={slug} src={commonProps.logoSrc} url={commonProps.logoLink} />
              </div>
            )}
          <div className="nav-bar max-container" id="navbar">
            {screenTooSmall && <BurgerNavbar {...commonProps} />}
            <FlatNavbar
              {...commonProps}
              setWidth={this.setFlatWidth}
              style={screenTooSmall ? { opacity: 0, position: 'absolute', top: '-200px' } : {}}
              maxWidth={maxAppWidth}
              isLargeLogo={isLargeLogo}
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
    i18n: state.i18n,
    timeline: state.timeline
  })),
  graphql(SectionsQuery, {
    options: ({ i18n }) => ({
      variables: {
        lang: i18n.locale
      }
    })
  }),
  withoutLoadingIndicator(),
  withScreenWidth
)(AssemblNavbar);