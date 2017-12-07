import React from 'react';
import { PropTypes } from 'prop-types';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import Loader from '../components/common/loader';
import { get } from '../utils/routeMap';
import Ideas from '../components/debate/common/ideas';
import Timeline from '../components/debate/navigation/timeline';
import AllIdeasQuery from '../graphql/AllIdeasQuery.graphql';

const DebateThread = ({ identifier, data, params, children, slug }) => {
  const { loading, ideas, rootIdea } = data;
  const isParentRoute = !params.themeId || false;
  const themeId = params.themeId || null;
  const childrenElm = React.Children.map(children, child =>
    React.cloneElement(child, {
      id: themeId,
      identifier: identifier
    })
  );
  return (
    <div className="debate">
      {loading && isParentRoute && <Loader color="black" />}
      <div>
        <section className="timeline-section" id="timeline">
          <div className="max-container">
            {!isParentRoute && (
              <Link className="burger-menu grey" to={get('debate', { slug: slug, phase: identifier })}>
                <div className="assembl-icon-thumb" />
                <div className="burger-menu-label">
                  <Translate value="debate.themes" />
                </div>
              </Link>
            )}
            <Timeline showNavigation={!isParentRoute} identifier={identifier} />
          </div>
        </section>
        {!loading &&
          ideas &&
          isParentRoute && <Ideas ideas={ideas} rootIdeaId={rootIdea.id} identifier={identifier} key={identifier} />}
        {!isParentRoute && <section className="debate-section">{childrenElm}</section>}
      </div>
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

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  slug: state.debate.debateData.slug
});

export default compose(connect(mapStateToProps), graphql(AllIdeasQuery))(DebateThread);