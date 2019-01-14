// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import Loader from '../components/common/loader';
import Ideas from '../components/debate/tableOfIdeas/ideas';
import AllIdeasQuery from '../graphql/AllIdeasQuery.graphql';

type Props = {
  phaseId: string,
  identifier: string,
  data: {
    loading: boolean,
    error: ?Error,
    rootIdea: ?Idea, // rootIdea may be null if phase table of thematics wasn't saved
    ideas: Array<Idea>
  },
  params: {
    phaseId: string,
    themeId?: string,
    questionId?: string
  },
  children: React.Node
};

const DebateThread = ({ phaseId, identifier, data, params, children }: Props) => {
  if (!data) {
    return (
      <div className="debate">
        <Loader color="black" />
      </div>
    );
  }
  const { loading, ideas, rootIdea } = data;
  const themeId = params.themeId || null;
  const questionId = params.questionId || null;
  const isParentRoute = !(themeId || questionId) || false;
  const childrenElm = React.Children.map(children, child =>
    React.cloneElement(child, {
      id: themeId || questionId,
      identifier: identifier,
      phaseId: phaseId
    })
  );

  return (
    <div className="debate">
      {loading && isParentRoute && <Loader color="black" />}
      {!loading && ideas && isParentRoute && rootIdea ? (
        <Ideas key={phaseId} ideas={ideas} rootIdeaId={rootIdea.id} identifier={identifier} phaseId={phaseId} />
      ) : null}
      {!isParentRoute && <section className="debate-section">{childrenElm}</section>}
    </div>
  );
};

DebateThread.defaultProps = {
  data: null
};

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  slug: state.debate.debateData.slug
});

export default compose(
  connect(mapStateToProps),
  graphql(AllIdeasQuery, {
    skip: ({ discussionPhaseId }) => !discussionPhaseId
  })
)(DebateThread);