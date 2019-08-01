// @flow
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import type { OperationComponent } from 'react-apollo';
import { compose, graphql } from 'react-apollo';
import { Grid } from 'react-bootstrap';
import { withRouter } from 'react-router';
import type { Map } from 'immutable';

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
import { DELETE_CALLBACK, DeletedPublicationStates, MESSAGE_VIEW, PublicationStates } from '../constants';
import HeaderStatistics, { statContributions, statMessages, statParticipants } from '../components/common/headerStatistics';
import InstructionView from '../components/debate/brightMirror/instructionView';
import { toggleHarvesting as toggleHarvestingAction } from '../actions/contextActions';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import Survey from './survey';
import VoteSession from './voteSession';
import { displayAlert } from '../utils/utilityManager';
import { DebateContext } from '../app';
import { defaultOrderPolicy } from '../components/debate/common/postsFilter/policies';

const deletedPublicationStates = Object.keys(DeletedPublicationStates);

type Props = {
  id: string,
  announcement: AnnouncementContent,
  contentLocaleMapping: ContentLocaleMapping,
  description: string,
  debateData: DebateData,
  defaultContentLocaleMapping: Map<string, string>,
  headerImgUrl: string,
  ideaWithPostsData: IdeaWithPostsQuery,
  identifier: string,
  isHarvesting: boolean,
  lang: string,
  location: { state: { callback: string } },
  phaseId: string,
  postsDisplayPolicy: PostsDisplayPolicy,
  postsMustBeRefetched: boolean,
  /** Function to call action to store tags on store */
  putTagsInStore: Function,
  messageViewOverride: string,
  routerParams: RouterParams,
  /** Tags information fetched from GraphQL */
  tags: Array<Tag>,
  timeline: Timeline,
  title: string,
  toggleHarvesting: Function,
  updateContentLocaleMapping: ContentLocaleMappingJS => void
} & SemanticAnalysisForThematicQuery;

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

type AdditionalProps = {
  debateData?: any,
  ideaId?: any,
  postsOrderPolicy?: PostsOrderPolicy | null,
  refetchIdea?: Function,
  routerParams?: any,
  timeline?: any
};

export const transformPosts = (edges: Array<Node>, messageColumns: Array<Column>, additionalProps: AdditionalProps = {}) => {
  const postsByParent = { root: [] };
  const { postsOrderPolicy, ...additionalPostProps } = additionalProps;
  const orderPolicy: PostsOrderPolicy = postsOrderPolicy || defaultOrderPolicy;

  const columns = { null: { colColor: null, colName: null } };
  messageColumns.forEach((col) => {
    columns[col.messageClassifier] = { colColor: col.color, colName: col.name };
  });
  const postIds = edges.map((edge: Node) => edge.node.id);

  edges.forEach((e) => {
    const postInfo = { ...e.node, ...additionalPostProps, ...columns[e.node.messageClassifier] };
    const parentId = !orderPolicy.postsGroupPolicy || !postInfo.parentId ? 'root' : postInfo.parentId;
    const items = postsByParent[parentId] ? postsByParent[parentId].slice() : [];
    items.push(postInfo);
    postsByParent[parentId] = items;
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

  // postsByParent.root is the list of top posts
  // filter out deleted top post without answers
  let postWithoutParents = [];
  Object.keys(postsByParent).forEach((key) => {
    if (key === 'root' || postIds.indexOf(key) === -1) {
      postWithoutParents = [...postsByParent[key], ...postWithoutParents];
    }
  });

  let topPosts: PostWithChildren[] = postWithoutParents
    .map((p) => {
      const newPost = p;
      newPost.children = getChildren(p.id);
      return newPost;
    })
    .filter(topPost => !(deletedPublicationStates.indexOf(topPost.publicationState) > -1 && topPost.children.length === 0));

  if (orderPolicy.postsGroupPolicy && orderPolicy.postsGroupPolicy.comparator) {
    topPosts = topPosts.sort(orderPolicy.postsGroupPolicy.comparator);
  }
  if (orderPolicy.postsGroupPolicy && orderPolicy.postsGroupPolicy.reverse) {
    topPosts = topPosts.reverse();
  }
  return topPosts;
};

// Function that counts the total number of posts in a Bright Mirror debate section
// transformedFilteredPosts parameter is built from transformPosts filtered with the current displayed fiction
export const getDebateTotalMessages = (transformedFilteredPosts: Array<PostWithChildren>) => {
  if (transformedFilteredPosts.length) {
    const publishedPosts = transformedFilteredPosts.filter(
      (post: PostWithChildren) =>
        post.publicationState !== PublicationStates.DELETED_BY_ADMIN &&
        post.publicationState !== PublicationStates.DELETED_BY_USER
    );
    return 1 + getDebateTotalMessages(publishedPosts[0].children) + getDebateTotalMessages(publishedPosts.slice(1));
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
    const { ideaWithPostsData, isHarvesting, postsMustBeRefreshed, toggleHarvesting } = this.props;
    this.displayBrightMirrorDeleteFictionMessage();
    const { hash } = window.location;
    const extractId = hash && hash !== '' && hash.split('#')[2];
    if (extractId && !isHarvesting) {
      toggleHarvesting();
    }
    if (postsMustBeRefreshed) {
      ideaWithPostsData.refetch();
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
    const { debateData, ideaWithPostsData, postsOrderPolicy, routerParams, timeline } = this.props;
    if (!ideaWithPostsData.idea) return [];
    return transformPosts(ideaWithPostsData.idea.posts.edges, ideaWithPostsData.idea.messageColumns, {
      debateData: debateData,
      ideaId: ideaWithPostsData.idea.id,
      postsOrderPolicy: postsOrderPolicy,
      refetchIdea: ideaWithPostsData.refetch,
      routerParams: routerParams,
      timeline: timeline
    });
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
      contentLocaleMapping: contentLocaleMapping,
      debateData: debateData,
      ideaId: id,
      ideaWithPostsData: ideaWithPostsData,
      identifier: identifier,
      initialRowIndex: ideaWithPostsData.loading
        ? undefined
        : this.getInitialRowIndex(topPosts, ideaWithPostsData.idea.posts.edges),
      isUserConnected: !!getConnectedUserId(),
      lang: lang,
      messageColumns: messageColumns,
      messageViewOverride: messageViewOverride,
      noRowsRenderer: noRowsRenderer,
      phaseId: phaseId,
      postsDisplayPolicy: this.props.threadFilter.postsDisplayPolicy,
      refetchIdea: refetchIdea,
      timeline: timeline
    };

    let view;
    if (isMultiColumns) {
      view = <ColumnsView {...childProps} posts={topPosts} routerParams={routerParams} />;
    } else if (isBrightMirror) {
      view = (
        <InstructionView
          {...childProps}
          posts={((topPosts: any): FictionPostPreview[])}
          announcementContent={announcement}
          semanticAnalysisForThematicData={semanticAnalysisForThematicData}
        />
      );
    } else {
      view = <ThreadView posts={topPosts} {...childProps} />;
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
  debateData: state.debate.debateData,
  defaultContentLocaleMapping: state.defaultContentLocaleMapping,
  isHarvesting: state.context.isHarvesting,
  lang: state.i18n.locale,
  postsDisplayPolicy: state.threadFilter.postsDisplayPolicy,
  postsFiltersStatus: state.threadFilter.postsFiltersStatus,
  postsMustBeRefreshed: state.threadFilter.postsMustBeRefreshed,
  postsOrderPolicy: state.threadFilter.postsOrderPolicy,
  timeline: state.timeline
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
  contextMessageViewOverride: string,
  isHarvestable: boolean,
  messageViewOverride: string,
  modifyContext: (newState: Object) => void,
  threadFilter: PostsFilterState
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
    return (
      <IdeaWithPosts
        {...props}
        postsOrder={props.threadFilter.postsOrderPolicy.graphqlPostsOrder}
        onlyMyPosts={props.threadFilter.postsFiltersStatus.onlyMyPosts} // fixme: more generic
        myPostsAndAnswers={props.threadFilter.postsFiltersStatus.myPostsAndAnswers} // fixme: more generic
        additionalFields={props.messageViewOverride === MESSAGE_VIEW.brightMirror}
      />
    );
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
  lang: state.i18n.locale,
  threadFilter: state.threadFilter
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