import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import Loader from '../components/common/loader';
import Ideas from '../components/debate/tableOfIdeas/ideas';
import AllIdeasQuery from '../graphql/AllIdeasQuery.graphql';

const DebateThread = ({ identifier, data, params, children }) => {
  const { loading, ideas, rootIdea } = data;
  const phaseId = params.phaseId || null;
  const themeId = params.themeId || null;
  const isParentRoute = !themeId || false;
  const childrenElm = React.Children.map(children, child =>
    React.cloneElement(child, {
      id: themeId,
      identifier: identifier,
      phaseId: phaseId
    })
  );

  return (
    <div className="debate">
      {loading && isParentRoute && <Loader color="black" />}
      {!loading &&
        ideas &&
        isParentRoute && (
          <Ideas ideas={ideas} rootIdeaId={rootIdea.id} identifier={identifier} key={identifier} phaseId={phaseId} />
        )}
      {!isParentRoute && <section className="debate-section">{childrenElm}</section>}
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