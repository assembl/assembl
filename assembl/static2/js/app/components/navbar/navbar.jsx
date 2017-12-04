import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { Navbar } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';

import { getCurrentPhaseIdentifier } from '../../utils/timeline';
import { get } from '../../utils/routeMap';
import { withScreenWidth } from '../common/screenDimensions';
import { connectedUserIsAdmin } from '../../utils/permissions';
import SectionsQuery from '../../graphql/SectionsQuery.graphql';
import FlatNavbar from './FlatNavbar';
import BurgerNavbar from './BurgerNavbar';
import { APP_CONTAINER_MAX_WIDTH, APP_CONTAINER_PADDING } from '../../constants';
import { snakeToCamel } from '../../utils/globalFunctions';

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

const sectionSlug = (sectionType) => {
  return snakeToCamel(sectionType === 'HOMEPAGE' ? 'HOME' : sectionType);
};

const sectionURL = ({ sectionType, url }, { slug, phaseIdentifier }) => {
  return url || `${get(sectionSlug(sectionType), { slug: slug, phase: phaseIdentifier })}`;
};

const SectionLink = ({ section, options }) => {
  const { title } = section;
  return (
    <Link to={sectionURL(section, options)} className="navbar-menu-item pointer" activeClassName="active" data-text={title}>
      {title}
    </Link>
  );
};

const mapSectionToElement = (section, options) => {
  return <SectionLink key={sectionKey(section)} section={section} options={options} />;
};

const sectionMapper = (options) => {
  return (section) => {
    return mapSectionToElement(section, options);
  };
};

class AssemblNavbar extends React.PureComponent {
  setFlatWidth = (newWidth) => {
    this.setState({ flatWidth: newWidth });
  };
  render = () => {
    const { screenWidth, debate, data, location } = this.props;
    const sections = (data && data.sections) || [];
    const { debateData } = debate;
    const { timeline, logo, slug, helpUrl } = debateData;
    const flatWidth = (this.state && this.state.flatWidth) || 0;
    const maxAppWidth = Math.min(APP_CONTAINER_MAX_WIDTH, screenWidth) - APP_CONTAINER_PADDING * 2;
    const screenTooSmall = flatWidth > maxAppWidth;
    const filteredSections = sections.filter(sectionFilter(data));
    const mapOptions = {
      slug: slug,
      currentPhaseIdentifier: getCurrentPhaseIdentifier(timeline)
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