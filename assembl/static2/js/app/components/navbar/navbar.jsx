// @flow

import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { Navbar } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import bind from 'lodash/bind';

import { getCurrentPhaseIdentifier, isSeveralIdentifiers } from '../../utils/timeline';
import { get } from '../../utils/routeMap';
import { withScreenWidth } from '../common/screenDimensions';
import { connectedUserIsAdmin } from '../../utils/permissions';
import SectionsQuery from '../../graphql/SectionsQuery.graphql';
import DiscussionQuery from '../../graphql/DiscussionQuery.graphql';
import FlatNavbar from './FlatNavbar';
import BurgerNavbar from './BurgerNavbar';
import { APP_CONTAINER_MAX_WIDTH, APP_CONTAINER_PADDING } from '../../constants';
import { getDiscussionSlug, snakeToCamel } from '../../utils/globalFunctions';
import withoutLoadingIndicator from '../common/withoutLoadingIndicator';
import DebateLink from '../debate/navigation/debateLink';
import Logo from './Logo';

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

const createRedirectionToV1 = () => () => {
  const slug = { slug: getDiscussionSlug() };
  window.location = get('oldVote', slug);
};

const mapDebateSectionToElement = (debateSection, options) => {
  const { title } = debateSection;
  const { phaseContext, displayRedirectionToV1 } = options;
  const key = sectionKey(debateSection);
  switch (phaseContext) {
  case 'modal':
    return (
      <div key={key} onClick={displayRedirectionToV1} className="navbar-menu-item pointer" data-text={title}>
        {title}
      </div>
    );
  case 'old':
    return (
      <a key={key} className="navbar-menu-item pointer" href={get('oldVote', { slug: options.slug })} data-text={title}>
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
  displayRedirectionToV1: () => mixed,
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
    const {
      screenWidth,
      location,
      debate,
      phase,
      sectionLoading,
      discussionLoading,
      sectionData,
      discussionData
    } = this.props;
    if (sectionLoading || discussionLoading || !(sectionData) || !(discussionData)) {
      return null;
    }
    const sections = sectionData.sections;
    const { debateData } = debate;
    const { timeline, logo, slug, helpUrl, isLargeLogo } = debateData;
    const flatWidth = (this.state && this.state.flatWidth) || 0;
    const maxAppWidth = Math.min(APP_CONTAINER_MAX_WIDTH, screenWidth) - APP_CONTAINER_PADDING * 2;
    const screenTooSmall = flatWidth > maxAppWidth;
    const filteredSections = sections.filter(sectionFilter(sectionData)).sort((a, b) => a.order - b.order);
    const mapOptions = {
      slug: slug,
      phase: getCurrentPhaseIdentifier(timeline),
      phaseContext: phaseContext(timeline, phase),
      displayRedirectionToV1: createRedirectionToV1(),
      screenTooSmall: screenTooSmall
    };
    const commonProps = {
      elements: filteredSections.map(bind(mapSectionToElement, null, bind.placeholder, mapOptions)),
      slug: slug,
      logoSrc: logo,
      helpUrl: helpUrl,
      location: location,
      logoLink: sections.length > 0 ? sections.find(section => section && section.sectionType === 'HOMEPAGE').url : '',
      loginData: discussionData.loginData
    };
    const { themeId } = this.props;
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
              themeId={themeId}
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
    i18n: state.i18n
  })),
  graphql(DiscussionQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { discussionLoading: true, discussionData: null };
      }
      if (data.error) {
        return { discussionLoading: false, discussionData: null };
      }

      return {
        discussionLoading: false,
        discussionData: data.discussion
      };
    }
  }),
  graphql(SectionsQuery, {
    options: ({ i18n }) => ({
      variables: {
        lang: i18n.locale
      }
    }),
    props: ({ data }) => {
      if (data.loading) {
        return { sectionloading: true, sectionData: null };
      }
      if (data.error) {
        return { sectionLoading: false, sectionData: { sections: [] } };
      }

      return {
        sectionLoading: false,
        sectionData: data
      };
    }
  }),
  withoutLoadingIndicator(),
  withScreenWidth
)(AssemblNavbar);