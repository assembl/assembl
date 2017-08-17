import React from 'react';
import { PropTypes } from 'prop-types';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { get } from '../utils/routeMap';
import Ideas from '../components/debate/common/ideas';
import Timeline from '../components/debate/navigation/timeline';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import AllIdeasQuery from '../graphql/AllIdeasQuery.graphql';

const DebateThread = ({ identifier, isNavbarHidden, data, params, children, slug }) => {
  const rootIdeaId = 'rootIdea' in data && 'id' in data.rootIdea ? data.rootIdea.id : null;
  const thematics = 'ideas' in data ? data.ideas : null;
  const isParentRoute = !params.themeId || false;
  const themeId = params.themeId || null;
  const childrenElm = React.Children.map(children, (child) => {
    return React.cloneElement(child, {
      id: themeId,
      identifier: identifier
    });
  });
  if (!rootIdeaId || !thematics) {
    return <div />;
  }
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
          {isParentRoute && <Ideas thematics={thematics} rootIdeaId={rootIdeaId} identifier={identifier} />}
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

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale,
    slug: state.debate.debateData.slug
  };
};

export default compose(connect(mapStateToProps), graphql(AllIdeasQuery), withLoadingIndicator({ textHidden: true, color: 'white' }))(
  DebateThread
);