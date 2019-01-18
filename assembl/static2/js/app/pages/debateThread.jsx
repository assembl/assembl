// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import Loader from '../components/common/loader';
import Ideas from '../components/debate/tableOfIdeas/ideas';
import AllIdeasQuery from '../graphql/AllIdeasQuery.graphql';
import { get, goTo } from '../utils/routeMap';

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
    slug: string,
    phase: string,
    themeId?: string,
    questionId?: string
  },
  children: React.Node
};

class DebateThread extends React.Component<Props> {
  static defaultProps = {
    data: null
  };

  componentDidUpdate() {
    const { data, params } = this.props;
    if (data && data.loading) {
      return;
    }
    const { ideas } = data;
    const themeId = params.themeId || null;
    const questionId = params.questionId || null;
    const isParentRoute = !(themeId || questionId) || false;
    // After fetching thematics, redirect to the thematic if there is only one
    if (isParentRoute && ideas.length === 1) {
      goTo(get('idea', { slug: params.slug, phase: params.phase, themeId: ideas[0].id }));
    }
  }

  render() {
    const { phaseId, identifier, data, params, children } = this.props;
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
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(AllIdeasQuery, {
    skip: ({ discussionPhaseId }) => !discussionPhaseId
  })
)(DebateThread);