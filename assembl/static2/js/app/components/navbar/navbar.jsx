// @noflow

import * as React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { Navbar } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import bind from 'lodash/bind';
import debounce from 'lodash/debounce';

import { getCurrentPhaseData } from '../../utils/timeline';
import { get } from '../../utils/routeMap';
import { withScreenWidth } from '../common/screenDimensions';
import Permissions, { connectedUserIsAdmin, connectedUserCan } from '../../utils/permissions';
import SectionsQuery from '../../graphql/SectionsQuery.graphql';
import DiscussionQuery from '../../graphql/DiscussionQuery.graphql';
import DiscussionPreferencesQuery from '../../graphql/DiscussionPreferencesQuery.graphql';
import BurgerNavbar from './BurgerNavbar';
import { APP_CONTAINER_MAX_WIDTH, APP_CONTAINER_PADDING } from '../../constants';
import { snakeToCamel } from '../../utils/globalFunctions';
import manageErrorAndLoading from '../common/manageErrorAndLoading';
import mergeLoadingAndError from '../common/mergeLoadingAndError';
import NavigationMenu from './navigationMenu';
import Logo from './Logo';
import UserMenu from './UserMenu';
import LanguageMenu, { refWidthUpdate } from './languageMenu';
import { addProtocol } from '../../utils/linkify';

const filterSection = ({ sectionType }, { hasResourcesCenter, hasSyntheses, isSemanticAnalysisEnabled }) => {
  switch (sectionType) {
  case 'RESOURCES_CENTER':
    return hasResourcesCenter;
  case 'SYNTHESES':
    return hasSyntheses || connectedUserCan(Permissions.EDIT_SYNTHESIS); // the OR is to be able to create a first synthesis!
  case 'ADMINISTRATION':
    return connectedUserIsAdmin();
  case 'HOMEPAGE':
    // The homepage button is the logo at the top left and it is renderered separately
    return false;
  case 'SEMANTIC_ANALYSIS':
    return isSemanticAnalysisEnabled;
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
    return `${get(sectionSlug(sectionType), { ...options, id: defaultAdminPhase }, { section: 1 })}`;
  }

  // url may be defined for non-custom sections (i.e. HOMEPAGE section)
  return sectionType === 'CUSTOM' ? url : url || get(sectionSlug(sectionType), options);
};

const SectionLink = ({ section, options }) => {
  const { title, url, sectionType } = section;
  if (url || sectionType === 'CUSTOM') {
    const urlWithHttpProtocol = addProtocol(url);
    return (
      <a href={urlWithHttpProtocol} className="navbar-menu-item pointer" data-text={title} target="_blank" rel="noopener">
        {title}
      </a>
    );
  }
  const sectionName =
    sectionType === 'SEMANTIC_ANALYSIS'
      ? sectionType.toLowerCase().replace('_', '-')
      : sectionType.toLowerCase().replace('_', '');
  const isActiveUrl = location.pathname
    .split('/')
    .slice(2)
    .join('/')
    .includes(sectionName);
  const linkClassNames = isActiveUrl ? 'navbar-menu-item pointer active' : 'navbar-menu-item pointer';
  return (
    <Link to={sectionURL(section, options)} className={linkClassNames} data-text={title}>
      {title}
    </Link>
  );
};
SectionLink.displayName = 'SectionLink';

type MapSectionOptions = {
  phase: string,
  phaseId: string,
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
  state = {
    flatWidth: 0,
    leftWidth: 0,
    rightWidth: 0,
    languageMenuWidth: 0
  };

  setLanguageMenuWidth = (width: number) => this.setState(() => ({ languageMenuWidth: width }));

  setFlatWidth = (newWidth: number) => {
    this.setState({ flatWidth: newWidth });
  };

  updateWidth = debounce(() => {
    const { leftWidth, rightWidth } = this.state;
    const margin = 10;
    // This setWidth may trigger a render loop, this is why we use debounce here.
    // Uncaught Error: Maximum update depth exceeded. This can happen when a component
    // repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
    // React limits the number of nested updates to prevent infinite loops.
    this.setFlatWidth(leftWidth + rightWidth + margin);
  }, 200);

  renderUserMenu = (remainingWidth: number) => {
    const { debate: { debateData: { helpUrl } }, location, discussionData } = this.props;
    const { loginData } = discussionData;
    return <UserMenu helpUrl={helpUrl} location={location} remainingWidth={remainingWidth} loginData={loginData} />;
  };

  render = () => {
<<<<<<< HEAD
    const { screenWidth, debate, phase, timeline, sectionData, logoData, isSemanticAnalysisEnabled } = this.props;
    const sections = sectionData.sections;
=======
    const { logoLink, maxWidth, timeline, screenWidth, debate, phase, sectionData, logoData } = this.props;
>>>>>>> fix bad rebase
    const { debateData } = debate;
    const { slug, isLargeLogo } = debateData;
    const remainingWidth = maxWidth - this.state.leftWidth + this.state.languageMenuWidth;
    const sections = sectionData.sections;
    const flatWidth = this.state.flatWidth;
    const maxAppWidth = Math.min(APP_CONTAINER_MAX_WIDTH, screenWidth) - APP_CONTAINER_PADDING * 2;
    const screenTooSmall = flatWidth > maxAppWidth;
    const sectionFilterOptions = { ...sectionData, isSemanticAnalysisEnabled: isSemanticAnalysisEnabled };
    const filteredSections = sections.filter(sectionFilter(sectionFilterOptions)).sort((a, b) => a.order - b.order);
    const { currentPhaseIdentifier, currentPhaseId } = getCurrentPhaseData(timeline);
    const mapOptions = {
      screenTooSmall: screenTooSmall,
      slug: slug,
      phase: currentPhaseIdentifier,
      phaseId: currentPhaseId,
      phaseContext: phaseContext(timeline, phase)
    };
    const commonProps = {
      elements: filteredSections.map(bind(mapSectionToElement, null, bind.placeholder, mapOptions)),
      slug: slug,
      logoSrc: logoData ? logoData.externalUrl : null,
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
            <div
              className="left-part"
              ref={refWidthUpdate(newWidth => this.setState(() => ({ leftWidth: newWidth }), this.updateWidth))}
            >
              {' '}
              {!isLargeLogo && (
                <BurgerNavbar
                  identifier={mapOptions.phase}
                  timeline={timeline}
                  elements={commonProps.elements}
                  renderUserMenu={this.renderUserMenu}
                />
              )}
              {!isLargeLogo && <Logo slug={slug} src={commonProps.logoSrc} url={logoLink} />}
              {!screenTooSmall && <NavigationMenu elements={commonProps.elements} />}
            </div>
            <div
              className="right-part"
              ref={refWidthUpdate(newWidth => this.setState(() => ({ rightWidth: newWidth }), this.updateWidth))}
            >
              {this.renderUserMenu(remainingWidth)}
              {!screenTooSmall && <LanguageMenu size="xs" className="navbar-language" setWidth={this.setLanguageMenuWidth} />}
            </div>
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
  graphql(DiscussionQuery, {
    options: ({ i18n }) => ({
      variables: {
        lang: i18n.locale
      }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          discussionQueryMetadata: {
            error: data.error,
            loading: data.loading
          },
          discussionData: null
        };
      }

      return {
        discussionQueryMetadata: {
          error: data.error,
          loading: data.loading
        },
        discussionData: data.discussion
      };
    }
  }),
  graphql(DiscussionPreferencesQuery, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          DiscussionPreferencesQueryMetadata: {
            error: data.error,
            loading: data.loading
          },
          logoData: null,
          isSemanticAnalysisEnabled: false
        };
      }
      return {
        DiscussionPreferencesQueryMetadata: {
          error: data.error,
          loading: data.loading
        },
        logoData: data.discussionPreferences.logo,
        isSemanticAnalysisEnabled: data.discussionPreferences.withSemanticAnalysis
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
      if (data.error || data.loading) {
        return {
          sectionsQueryMetadata: {
            error: data.error,
            loading: data.loading
          },
          sectionData: { sections: [] }
        };
      }

      return {
        sectionsQueryMetadata: {
          error: data.error,
          loading: data.loading
        },
        sectionData: data
      };
    }
  }),
  mergeLoadingAndError(['discussionQueryMetadata', 'sectionsQueryMetadata']),
  manageErrorAndLoading({ displayLoader: false }),
  withScreenWidth
)(AssemblNavbar);