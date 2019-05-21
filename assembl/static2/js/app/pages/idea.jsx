// @flow
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { Grid } from 'react-bootstrap';
import { withRouter } from 'react-router';
// Type imports
import type { Map } from 'immutable';
import type { OperationComponent } from 'react-apollo';
import type { ContentLocaleMapping, ContentLocaleMappingJS } from '../actions/actionTypes';
import type { AnnouncementContent } from '../components/debate/common/announcement';

import { updateContentLocale } from '../actions/contentLocaleActions';
import Header from '../components/common/header';
import IdeaQuery from '../graphql/IdeaQuery.graphql';
import IdeaWithPostsQuery from '../graphql/IdeaWithPostsQuery.graphql';
import SemanticAnalysisForThematicQuery from '../graphql/SemanticAnalysisForThematicQuery.graphql';
import TagsQuery from '../graphql/TagsQuery.graphql';
import { updateTags } from '../actions/tagActions';
import GoUp from '../components/common/goUp';
import Loader from '../components/common/loader';
import { getConnectedUserId } from '../utils/globalFunctions';
import Announcement, { getSentimentsCount } from './../components/debate/common/announcement';
import ColumnsView from '../components/debate/multiColumns/columnsView';
import ThreadView from '../components/debate/thread/threadView';
import { DeletedPublicationStates, DELETE_CALLBACK, MESSAGE_VIEW } from '../constants';
import HeaderStatistics, { statContributions, statMessages, statParticipants } from '../components/common/headerStatistics';
import InstructionView from '../components/debate/brightMirror/instructionView';
import { toggleHarvesting as toggleHarvestingAction } from '../actions/contextActions';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import Survey from './survey';
import VoteSession from './voteSession';
// Utils imports
import { displayAlert } from '../utils/utilityManager';
import { DebateContext } from '../app';

const deletedPublicationStates = Object.keys(DeletedPublicationStates);

type Props = {
  contentLocaleMapping: ContentLocaleMapping,
  defaultContentLocaleMapping: Map<string, string>,
  updateContentLocaleMapping: ContentLocaleMappingJS => void,
  timeline: Timeline,
  debateData: DebateData,
  lang: string,
  ideaWithPostsData: IdeaWithPostsQuery,
  messageViewOverride: string,
  identifier: string,
  phaseId: string,
  routerParams: RouterParams,
  location: {
    state: { callback: string }
  },
  announcement: AnnouncementContent,
  id: string,
  headerImgUrl: string,
  title: string,
  description: string,
  toggleHarvesting: Function,
  isHarvesting: boolean,
  /** Tags information fetched from GraphQL */
  tags: Array<Tag>,
  /** Function to call action to store tags on store */
  putTagsInStore: Function
} & SemanticAnalysisForThematicQuery;

type PostWithChildren = {
  children: Array<PostWithChildren>
} & Post;

type Column = {
  messageClassifier: string,
  color: string,
  name: string
};

type Node = {
  node: { messageClassifier: string, [string]: any }
};

const creationDateDescComparator = (a: Post, b: Post) => {
  if (a.creationDate > b.creationDate) {
    return -1;
  }
  if (a.creationDate === b.creationDate) {
    return 0;
  }
  return 1;
};

/*
 * From a post, get the latest creationDate of live descendants and self
 */
const getLatest = (post: PostWithChildren) => {
  let maxDate = post.creationDate;
  if (post.children.length === 0) {
    if (deletedPublicationStates.indexOf(post.publicationState) > -1) {
      return null;
    }
    return maxDate;
  }
  post.children.forEach((p) => {
    const date = getLatest(p);
    if (date && date > maxDate) {
      maxDate = date;
    }
  });
  return maxDate;
};

const creationDateLastDescendantComparator = (a: PostWithChildren, b: PostWithChildren) => {
  const firstDate = getLatest(a) || '';
  const secondDate = getLatest(b) || '';
  if (firstDate > secondDate) {
    return -1;
  }
  if (firstDate === secondDate) {
    return 0;
  }
  return 1;
};

export const transformPosts = (edges: Array<Node>, messageColumns: Array<Column>, additionnalProps: { [string]: any } = {}) => {
  const postsByParent = {};
  const columns = { null: { colColor: null, colName: null } };
  messageColumns.forEach((col) => {
    columns[col.messageClassifier] = { colColor: col.color, colName: col.name };
  });
  edges.forEach((e) => {
    const p = { ...e.node, ...additionnalProps, ...columns[e.node.messageClassifier] };
    const items = postsByParent[p.parentId] || [];
    postsByParent[p.parentId] = items;
    items.push(p);
  });

  const getChildren = id =>
    (postsByParent[id] || [])
      .map((post) => {
        const newPost = post;
        // We modify the object in place, we are sure it's already a copy from
        // the forEach edges above.
        newPost.children = getChildren(post.id);
        return newPost;
      })
      .sort(creationDateDescComparator);

  // postsByParent.null is the list of top posts
  // filter out deleted top post without answers
  return (postsByParent.null || [])
    .map((p) => {
      const newPost = p;
      newPost.children = getChildren(p.id);
      return newPost;
    })
    .filter(topPost => !(deletedPublicationStates.indexOf(topPost.publicationState) > -1 && topPost.children.length === 0))
    .sort(creationDateLastDescendantComparator);
};

// Function that counts the total number of posts in a Bright Mirror debate section
// transformedFilteredPosts parameter is built from transformPosts filtered with the current displayed fiction
export const getDebateTotalMessages = (transformedFilteredPosts: Array<Object>) => {
  if (transformedFilteredPosts.length) {
    return (
      1 + getDebateTotalMessages(transformedFilteredPosts[0].children) + getDebateTotalMessages(transformedFilteredPosts.slice(1))
    );
  }
  return 0;
};

export const noRowsRenderer = () => (
  <div className="center no-rows margin-txt-xxs">
    <Translate value="debate.thread.noPostsInThread" />
  </div>
);

class Idea extends React.Component<Props> {
  componentWillMount() {
    const { tags, putTagsInStore } = this.props;
    putTagsInStore(tags);
  }

  componentDidMount() {
    const { toggleHarvesting, isHarvesting } = this.props;
    this.displayBrightMirrorDeleteFictionMessage();
    const { hash } = window.location;
    const extractId = hash && hash !== '' && hash.split('#')[2];
    if (extractId && !isHarvesting) {
      toggleHarvesting();
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.ideaWithPostsData.idea !== this.props.ideaWithPostsData.idea) {
      this.updateContentLocaleMappingFromProps(nextProps);
    }
  }

  updateContentLocaleMappingFromProps(props: Props) {
    const { defaultContentLocaleMapping, ideaWithPostsData, updateContentLocaleMapping } = props;
    if (!ideaWithPostsData.loading) {
      const postsEdges = ideaWithPostsData.idea.posts.edges;
      const contentLocaleMappingData = {};
      postsEdges.forEach((edge) => {
        const post = edge.node;
        const { id, originalLocale } = post;
        const contentLocale = defaultContentLocaleMapping.get(originalLocale, originalLocale);
        contentLocaleMappingData[id] = {
          contentLocale: contentLocale,
          originalLocale: post.originalLocale
        };
      });

      updateContentLocaleMapping(contentLocaleMappingData);
    }
  }

  getInitialRowIndex = (topPosts, edges) => {
    const { hash } = window.location;
    if (hash !== '') {
      const id = hash.split('#')[1].split('?')[0];
      const allPosts = {};
      edges.forEach((e) => {
        allPosts[e.node.id] = e.node;
      });
      let post = allPosts[id];
      if (!post) {
        return null;
      }

      while (post.parentId) {
        post = allPosts[post.parentId];
      }
      const topPostId = post.id;
      const index = topPosts.findIndex(value => value.id === topPostId);
      if (index > -1) {
        return index;
      }
      return null;
    }
    return null;
  };

  getTopPosts = () => {
    const { ideaWithPostsData, routerParams, timeline, debateData } = this.props;
    if (!ideaWithPostsData.idea) return [];
    const topPosts = transformPosts(ideaWithPostsData.idea.posts.edges, ideaWithPostsData.idea.messageColumns, {
      refetchIdea: ideaWithPostsData.refetch,
      ideaId: ideaWithPostsData.idea.id,
      routerParams: routerParams,
      timeline: timeline,
      debateData: debateData
    });
    return topPosts;
  };

  displayBrightMirrorDeleteFictionMessage() {
    // Location state is set in brightMirrorFiction.jsx > deleteFictionCallback
    const locationState = this.props.location.state;
    if (locationState && locationState.callback === DELETE_CALLBACK) {
      displayAlert('success', I18n.t('debate.brightMirror.deleteFictionSuccessMsg'));
    }
  }

  render() {
    const {
      contentLocaleMapping,
      debateData,
      lang,
      ideaWithPostsData,
      identifier,
      messageViewOverride,
      phaseId,
      routerParams,
      semanticAnalysisForThematicData,
      timeline
    } = this.props;
    const refetchIdea = ideaWithPostsData.refetch;
    const { announcement, id, headerImgUrl, title, description } = this.props;
    const isMultiColumns = ideaWithPostsData.loading
      ? false
      : ideaWithPostsData.idea.messageViewOverride === MESSAGE_VIEW.messageColumns;
    const isBrightMirror = ideaWithPostsData.loading
      ? false
      : ideaWithPostsData.idea.messageViewOverride === MESSAGE_VIEW.brightMirror;
    const messageColumns = ideaWithPostsData.loading
      ? undefined
      : [...ideaWithPostsData.idea.messageColumns].sort((a, b) => {
        if (a.index < b.index) {
          return -1;
        }
        if (a.index > b.index) {
          return 1;
        }
        return 0;
      });
    const topPosts = this.getTopPosts();
    const childProps = {
      messageViewOverride: messageViewOverride,
      identifier: identifier,
      phaseId: phaseId,
      timeline: timeline,
      debateData: debateData,
      ideaId: id,
      ideaWithPostsData: ideaWithPostsData,
      isUserConnected: !!getConnectedUserId(),
      contentLocaleMapping: contentLocaleMapping,
      refetchIdea: refetchIdea,
      lang: lang,
      noRowsRenderer: noRowsRenderer,
      messageColumns: messageColumns,
      posts: topPosts,
      initialRowIndex: ideaWithPostsData.loading
        ? undefined
        : this.getInitialRowIndex(topPosts, ideaWithPostsData.idea.posts.edges)
    };

    let view;
    if (isMultiColumns) {
      view = <ColumnsView {...childProps} routerParams={routerParams} />;
    } else if (isBrightMirror) {
      view = (
        <InstructionView
          {...childProps}
          announcementContent={announcement}
          semanticAnalysisForThematicData={semanticAnalysisForThematicData}
        />
      );
    } else {
      view = <ThreadView {...childProps} />;
    }

    let statElements = [];
    if (ideaWithPostsData.idea) {
      const numPosts = ideaWithPostsData.idea.numPosts;
      const counters = getSentimentsCount(ideaWithPostsData.idea.posts);
      let totalSentiments = 0;
      Object.keys(counters).forEach((key) => {
        totalSentiments += counters[key].count;
      });
      const numContributions = numPosts + totalSentiments;
      const numParticipants = ideaWithPostsData.idea.numContributors;
      statElements = [statMessages(numPosts), statContributions(numContributions), statParticipants(numParticipants)];
    }
    return (
      <div className="idea">
        <Header title={title} subtitle={description} imgUrl={headerImgUrl} phaseId={phaseId} type="idea">
          <HeaderStatistics statElements={statElements} />
        </Header>
        <section className="post-section">
          {!ideaWithPostsData.loading &&
            !isBrightMirror &&
            announcement && (
              <Grid fluid className="background-light padding-left-right">
                <div className="max-container">
                  <div className="content-section">
                    <Announcement
                      announcement={announcement}
                      idea={ideaWithPostsData.idea}
                      semanticAnalysisForThematicData={semanticAnalysisForThematicData}
                    />
                  </div>
                </div>
              </Grid>
            )}
          {ideaWithPostsData.loading ? <Loader /> : view}
        </section>
        <GoUp />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  contentLocaleMapping: state.contentLocale,
  timeline: state.timeline,
  defaultContentLocaleMapping: state.defaultContentLocaleMapping,
  lang: state.i18n.locale,
  debateData: state.debate.debateData,
  isHarvesting: state.context.isHarvesting
});

const mapDispatchToProps = dispatch => ({
  updateContentLocaleMapping: info => dispatch(updateContentLocale(info)),
  toggleHarvesting: () => dispatch(toggleHarvestingAction()),
  putTagsInStore: tags => dispatch(updateTags(tags))
});

const IdeaWithPosts = compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(IdeaWithPostsQuery, { name: 'ideaWithPostsData' }),
  withRouter
)(Idea);

type SwitchViewProps = {
  messageViewOverride: string,
  contextMessageViewOverride: string,
  modifyContext: (newState: Object) => void,
  isHarvestable: boolean
};

class SwitchView extends React.Component<SwitchViewProps> {
  componentDidMount() {
    this.setIsHarvestable();
  }

  componentDidUpdate() {
    this.setIsHarvestable();
  }

  setIsHarvestable = () => {
    const { modifyContext, isHarvestable, messageViewOverride, contextMessageViewOverride } = this.props;
    const isHarvestableIdea = messageViewOverride === MESSAGE_VIEW.thread || messageViewOverride === MESSAGE_VIEW.messageColumns;
    if (isHarvestableIdea !== isHarvestable || messageViewOverride !== contextMessageViewOverride) {
      modifyContext({ isHarvestable: isHarvestableIdea, messageViewOverride: messageViewOverride });
    }
  };

  render() {
    const props = this.props;
    if (props.messageViewOverride === MESSAGE_VIEW.survey) {
      return <Survey {...props} />;
    }
    if (props.messageViewOverride === MESSAGE_VIEW.voteSession) {
      return <VoteSession {...props} />;
    }
    return <IdeaWithPosts {...props} additionalFields={props.messageViewOverride === MESSAGE_VIEW.brightMirror} />;
  }
}

const SwitchViewWithContext = props => (
  <DebateContext.Consumer>
    {({ modifyContext, isHarvestable, messageViewOverride }) => (
      <SwitchView
        {...props}
        isHarvestable={isHarvestable}
        contextMessageViewOverride={messageViewOverride}
        modifyContext={modifyContext}
      />
    )}
  </DebateContext.Consumer>
);

const semanticAnalysisForThematicQuery: OperationComponent<SemanticAnalysisForThematicQuery, IdeaQueryVariables, Props> = graphql(
  SemanticAnalysisForThematicQuery,
  {
    props: ({ data }) => data
  }
);

const mapStateToPropsForIdeaQuery = state => ({
  lang: state.i18n.locale
});

export default compose(
  connect(mapStateToPropsForIdeaQuery, mapDispatchToProps),
  graphql(IdeaQuery, {
    options: { notifyOnNetworkStatusChange: true },
    // ideaData.loading stays to true when switching interface language (IdeaQuery is using lang variable)
    // This is an issue in apollo-client, adding notifyOnNetworkStatusChange: true is a workaround,
    // downgrading to apollo-client 1.8.1 should works too.
    // See https://github.com/apollographql/apollo-client/issues/1186#issuecomment-327161526
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        announcement: data.idea.announcement,
        id: data.idea.id,
        title: data.idea.title,
        description: data.idea.description,
        headerImgUrl: data.idea.img ? data.idea.img.externalUrl : '',
        messageViewOverride: data.idea.messageViewOverride
      };
    }
  }),
  graphql(TagsQuery, {
    props: ({ data }) => ({ tags: data.tags })
  }),
  semanticAnalysisForThematicQuery,
  manageErrorAndLoading({ displayLoader: true })
)(SwitchViewWithContext);