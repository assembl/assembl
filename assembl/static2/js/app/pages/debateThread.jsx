import React from 'react';
import { PropTypes } from 'prop-types';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { get } from '../utils/routeMap';
import Ideas from '../components/debate/common/ideas';
import Timeline from '../components/debate/navigation/timeline';
import RootIdeasQuery from '../graphql/RootIdeasQuery.graphql';

const DebateThread = ({ identifier, isNavbarHidden, data, params, children, slug }) => {
  const thematics = data.rootIdea ? data.rootIdea.children : [];
  const isParentRoute = !params.themeId || false;
  const themeId = params.themeId || null;
  const childrenElm = React.Children.map(children, (child) => {
    return React.cloneElement(child, {
      id: themeId,
      identifier: identifier
    });
  });
  return (
    <div className="debate">
      {thematics &&
        <div>
          <section className={isNavbarHidden ? 'timeline-section timeline-top' : 'timeline-section timeline-shifted'} id="timeline">
            <div className="max-container">
              {!isParentRoute &&
                <Link className="burger-menu grey" to={get('debate', { slug: slug, phase: identifier })}>
                  <div className="assembl-icon-thumb" />
                  <div className="burger-menu-label">
                    <Translate value="debate.themes" />
                  </div>
                </Link>}
              <Timeline showNavigation={!isParentRoute} identifier={identifier} />
            </div>
          </section>
          {isParentRoute && <Ideas thematics={thematics} identifier={identifier} />}
          {!isParentRoute &&
            <section className="debate-section">
              {childrenElm}
            </section>}
        </div>}
    </div>
  );
};

DebateThread.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    ideas: PropTypes.Array
  }).isRequired
};

const DebateWithData = graphql(RootIdeasQuery)(DebateThread);

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale,
    slug: state.debate.debateData.slug
  };
};

export default connect(mapStateToProps)(DebateWithData);