/* eslint no-underscore-dangle: 0, max-len: ["warn", 136] */
import React from 'react';
import { Localize, Translate, I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import {
  ActionBar,
  ActionBarRow,
  BoolMust,
  BoolMustNot,
  CheckboxFilter,
  CheckboxItemList,
  HasChildQuery,
  HitsStats,
  InitialLoader,
  Layout,
  LayoutBody,
  LayoutResults,
  MenuFilter,
  Pagination,
  Panel,
  RangeFilter,
  RangeQuery,
  ResetFilters,
  SearchBox,
  SearchkitManager,
  SearchkitProvider,
  SideBar,
  TagFilter,
  TagFilterConfig,
  TermQuery,
  TopBar
} from 'searchkit';
import get from 'lodash/get';
import truncate from 'lodash/truncate';

import DateRangeFilter from './search/DateRangeFilter';
import MenuFilterCustomAll from './search/MenuFilterCustomAll';
import HitsWithScrollTop from './search/HitsWithScrollTop';
import FilteredSortingSelector from './search/SortingSelector';
import ProfileLine from './common/profileLine';
import { getConnectedUserId, getDebateId, getLocale } from '../reducers/contextReducer';
import { connectedUserIsExpert } from '../utils/permissions';
import { get as getRoute } from '../utils/routeMap';
import UserMessagesTagFilter from './search/UserMessagesTagFilter';
import { toggleHarvesting as toggleHarvestingAction } from '../actions/contextActions';
import SuggestionContainer from './common/suggestionContainer/suggestionContainer';
import { MESSAGE_VIEW } from '../constants';

const FRAGMENT_SIZE = 400;
const elasticsearchLangIndexesElement = document.getElementById('elasticsearchLangIndexes');
const elasticsearchLangIndexes = elasticsearchLangIndexesElement ? elasticsearchLangIndexesElement.value.split(' ') : [];

const truncateText = text => truncate(text, { length: FRAGMENT_SIZE, separator: ' ', omission: ' [...]' });

const highlightedTextOrTruncatedText = (hit, field) => {
  let text = get(hit, `highlight.${field}`);
  if (text) {
    if (Array.isArray(text)) {
      // take the first highlight fragment
      text = text[0];
    }
    return text;
  }

  text = truncateText(hit._source[field]);
  return text;
};

function getPostUrl(ideaId, postId, phaseIdentifier, messageViewOverride, slug, extractId) {
  if (!ideaId || !phaseIdentifier) {
    return undefined;
  }
  const ideaBase64id = btoa(`Idea:${ideaId}`);
  const postBase64id = btoa(`Post:${postId}`);
  const extractBase64id = btoa(`Extract:${extractId}`);
  if ((messageViewOverride === MESSAGE_VIEW.thread || messageViewOverride === MESSAGE_VIEW.messageColumns) && !extractId) {
    return getRoute('post', {
      slug: slug,
      phase: phaseIdentifier,
      themeId: ideaBase64id,
      postId: postBase64id
    });
  } else if (messageViewOverride === MESSAGE_VIEW.survey) {
    return getRoute('questionPost', {
      slug: slug,
      phase: phaseIdentifier,
      questionId: ideaBase64id,
      questionIndex: 1,
      postId: postBase64id
    });
  } else if (extractId) {
    return getRoute('extract', {
      slug: slug,
      phase: phaseIdentifier,
      themeId: ideaBase64id,
      postId: postBase64id,
      extractId: extractBase64id
    });
  }
  return undefined;
}

function getIdeaUrl(ideaId, phaseIdentifier, slug) {
  if (!ideaId || !phaseIdentifier) {
    return undefined;
  }
  const ideaBase64id = btoa(`Idea:${ideaId}`);
  return getRoute('idea', {
    slug: slug,
    phase: phaseIdentifier,
    themeId: ideaBase64id
  });
}

const slugElement = document.getElementById('discussion-slug');
const slug = slugElement ? slugElement.value : '';

const getUrl = (hit) => {
  const id = hit._source.id;
  switch (hit._type) {
  case 'synthesis': {
    const postBase64id = btoa(`Post:${id}`);
    return getRoute('synthesis', { slug: slug, synthesisId: postBase64id });
  }
  case 'user':
    return undefined;
  case 'idea': {
    const phaseIdentifier = hit._source.phase_identifier;
    const ideaId = id;
    return getIdeaUrl(ideaId, phaseIdentifier, slug);
  }
  case 'extract': {
    const phaseIdentifier = hit._source.phase_identifier;
    const ideaId = hit._source.idea_id[0];
    const postId = hit._source.post_id;
    const extractId = hit._source.id;
    const messageViewOverride = hit._source.message_view_override;
    return getPostUrl(ideaId, postId, phaseIdentifier, messageViewOverride, slug, extractId);
  }
  default: {
    // post
    const phaseIdentifier = hit._source.phase_identifier;
    const ideaId = hit._source.idea_id[0];
    const messageViewOverride = hit._source.message_view_override;
    return getPostUrl(ideaId, id, phaseIdentifier, messageViewOverride, slug);
  }
  }
};

const PublishedInfo = ({ date, publishedOnMsgId, userId, userName, relatedIdeasTitles, ideaUrl, onLinkClick }) => {
  const hasRelatedIdeasTitles = relatedIdeasTitles && relatedIdeasTitles.length > 0;

  const suggestionContainerProps = {
    suggestionList: relatedIdeasTitles,
    suggestionContainerTitle: I18n.t('debate.thread.linkIdea')
  };

  return (
    <React.Fragment>
      <Translate value={publishedOnMsgId} /> <Localize value={date} dateFormat="date.format" /> <Translate value="search.by" />{' '}
      <TagFilter key={userId} field="creator_id" value={userId}>
        <ProfileLine userId={userId} userName={userName} />
      </TagFilter>
      {hasRelatedIdeasTitles && ideaUrl ? (
        <Link to={ideaUrl} onClick={onLinkClick}>
          <SuggestionContainer {...suggestionContainerProps} />
        </Link>
      ) : null}
    </React.Fragment>
  );
};

PublishedInfo.defaultProps = {
  publishedOnMsgId: 'search.published_on'
};

const TYPE_TO_ICON = {
  extract: 'discussion',
  user: 'profil',
  post: 'discussion',
  idea: 'idea',
  synthesis: 'synthesis'
};

const ImageType = props => <span className={`${props.className} assembl-icon-${TYPE_TO_ICON[props.type]}`} />;

const getFieldAnyLang = (source, prop, locale) => {
  let result;
  if (!source) {
    // when source is hit.highlight, can be undefined
    return result;
  }
  if (source[`${prop}_${locale}`]) {
    return source[`${prop}_${locale}`];
  }
  elasticsearchLangIndexes.forEach((lang) => {
    if (result === undefined) {
      const key = `${prop}_${lang}`;
      if (source[key]) {
        result = source[key];
      }
    }
  });
  if (result) {
    return result;
  }
  if (source[`${prop}_other`]) {
    return source[`${prop}_other`];
  }
  return result;
};

const highlightedLS = (hit, field, locale) => {
  let text = getFieldAnyLang(hit.highlight, field, locale);
  if (Array.isArray(text)) {
    // take the first highlight fragment
    text = text[0];
  }
  return text;
};

const highlightedLSOrTruncatedLS = (hit, field, locale) => {
  let text = highlightedLS(hit, field, locale);
  if (text) {
    return text;
  }

  text = getFieldAnyLang(hit._source, field, locale);
  if (text) {
    return truncateText(text);
  }
  return '';
};

const BaseHit = ({ bemBlocks, imageType, onLinkClick, title, url, renderBody, renderFooter }) => (
  <div className={bemBlocks.item().mix(bemBlocks.container('item'))}>
    <ImageType type={imageType} className={bemBlocks.item('imgtype')} />
    <div className={bemBlocks.item('title')}>
      {url ? (
        <Link onClick={onLinkClick} to={url} dangerouslySetInnerHTML={{ __html: title }} />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: title }} />
      )}
    </div>
    {renderBody && <div className={bemBlocks.item('content')}>{renderBody()}</div>}
    <div className={bemBlocks.item('info')}>{renderFooter()}</div>
  </div>
);

const PostHit = ({ bemBlocks, collapseSearch, locale, result }) => {
  const source = result._source;
  const subject = highlightedLSOrTruncatedLS(result, 'subject', locale);
  const body = highlightedLSOrTruncatedLS(result, 'body', locale);
  const published = {};
  const ideaTitle = highlightedLSOrTruncatedLS(result, 'idea_title', locale);
  const postUrl = getUrl(result);
  const ideaUrl = postUrl ? postUrl.slice(0, postUrl.indexOf('#')) : '';
  // subject may be an empty string if the post comes from multiColumns idea and the body
  // locale wasn't detected, in this case fallback to ideaTitle
  return (
    <BaseHit
      bemBlocks={bemBlocks}
      imageType={result._type}
      title={subject || ideaTitle}
      url={postUrl}
      onLinkClick={collapseSearch}
      published={published}
      renderBody={() => (
        <React.Fragment>
          <div dangerouslySetInnerHTML={{ __html: body }} />
          <div>
            <div title={I18n.t('search.like')} className="emoticon LikeSentimentOfPost" />
            <div className="emoticonValue">{source.sentiment_counts.like}</div>
            <div title={I18n.t('search.disagree')} className="emoticon DisagreeSentimentOfPost" />
            <div className="emoticonValue">{source.sentiment_counts.disagree}</div>
            <div title={I18n.t('search.dont_understand')} className="emoticon DontUnderstandSentimentOfPost" />
            <div className="emoticonValue">{source.sentiment_counts.dont_understand}</div>
            <div title={I18n.t('search.more_info')} className="emoticon MoreInfoSentimentOfPost" />
            <div className="emoticonValue">{source.sentiment_counts.more_info}</div>
          </div>
        </React.Fragment>
      )}
      renderFooter={() => (
        <PublishedInfo
          date={source.creation_date}
          userId={source.creator_id}
          userName={source.creator_display_name}
          relatedIdeasTitles={[ideaTitle]}
          ideaUrl={ideaUrl}
          onLinkClick={collapseSearch}
        />
      )}
    />
  );
};

const DumbExtractHit = ({ bemBlocks, collapseSearch, isHarvesting, locale, toggleHarvesting, result }) => {
  const source = result._source;
  const subject = highlightedLSOrTruncatedLS(result, 'subject', locale);
  const body = highlightedTextOrTruncatedText(result, 'body');
  const onLinkClick = () => {
    if (!isHarvesting) {
      toggleHarvesting();
    }
    collapseSearch();
  };
  const ideaTitle = highlightedLSOrTruncatedLS(result, 'idea_title', locale);
  const extractUrl = getUrl(result);
  const ideaUrl = extractUrl ? extractUrl.slice(0, extractUrl.indexOf('#')) : '';
  return (
    <BaseHit
      bemBlocks={bemBlocks}
      imageType={result._type}
      title={subject}
      url={extractUrl}
      onLinkClick={onLinkClick}
      renderBody={() => <div dangerouslySetInnerHTML={{ __html: body }} />}
      renderFooter={() => (
        <PublishedInfo
          date={source.creation_date}
          userId={source.creator_id}
          userName={source.creator_display_name}
          publishedOnMsgId="search.harvested_on"
          relatedIdeasTitles={[ideaTitle]}
          ideaUrl={ideaUrl}
          onLinkClick={onLinkClick}
        />
      )}
    />
  );
};

const mapStateToExtractHitProps = state => ({
  isHarvesting: state.context.isHarvesting
});
const mapDispatchToExtractHitProps = dispatch => ({
  toggleHarvesting: () => dispatch(toggleHarvestingAction())
});

const ExtractHit = connect(mapStateToExtractHitProps, mapDispatchToExtractHitProps)(DumbExtractHit);

const SynthesisHit = ({ bemBlocks, collapseSearch, locale, result }) => {
  const source = result._source;
  const subject = highlightedLSOrTruncatedLS(result, 'subject', locale);
  const ideas = highlightedLSOrTruncatedLS(result, 'ideas', locale);
  const introduction = highlightedLSOrTruncatedLS(result, 'introduction', locale);
  const conclusion = highlightedLSOrTruncatedLS(result, 'conclusion', locale);
  return (
    <BaseHit
      bemBlocks={bemBlocks}
      imageType={result._type}
      title={subject}
      url={getUrl(result)}
      onLinkClick={collapseSearch}
      renderBody={() => (
        <React.Fragment>
          <div style={{ backgroundColor: '#f4f4f4' }} dangerouslySetInnerHTML={{ __html: introduction }} />
          {ideas ? <p style={{ paddingLeft: '1em', marginTop: '1em' }} dangerouslySetInnerHTML={{ __html: ideas }} /> : null}
          <div style={{ backgroundColor: '#f4f4f4', marginTop: '1em' }} dangerouslySetInnerHTML={{ __html: conclusion }} />
        </React.Fragment>
      )}
      renderFooter={() => (
        <PublishedInfo date={source.creation_date} userId={source.creator_id} userName={source.creator_display_name} />
      )}
    />
  );
};

const UserHit = ({ bemBlocks, collapseSearch, result }) => {
  const source = result._source;
  const fullname = get(result, 'highlight.name', result._source.name);
  const userId = result._source.id;
  return (
    <BaseHit
      bemBlocks={bemBlocks}
      imageType={result._type}
      title={fullname}
      url={getUrl(result)}
      onLinkClick={collapseSearch}
      renderBody={null}
      renderFooter={() => (
        <React.Fragment>
          <UserMessagesTagFilter value={userId}>
            {source.num_posts}
            <span className={bemBlocks.item('assembl-icon-message')}>
              <span className="assembl-icon-message" title={I18n.t('search.number_of_contributions')} />
            </span>
          </UserMessagesTagFilter>
          {source.creation_date ? (
            <span>
              <Translate value="search.member_since" /> <Localize value={source.creation_date} dateFormat="date.format" />
            </span>
          ) : null}
        </React.Fragment>
      )}
    />
  );
};

const IdeaHit = ({ bemBlocks, collapseSearch, locale, result }) => {
  const source = result._source;
  const title = highlightedLSOrTruncatedLS(result, 'title', locale);
  const description = highlightedLSOrTruncatedLS(result, 'description', locale);
  const synthesisTitle = highlightedLSOrTruncatedLS(result, 'synthesis_title', locale);
  // const announceTitle = highlightedLSOrTruncatedLS(result, 'announcement_title', locale);
  const announceBody = highlightedLSOrTruncatedLS(result, 'announcement_body', locale);
  return (
    <BaseHit
      bemBlocks={bemBlocks}
      imageType={result._type}
      title={title}
      url={getUrl(result)}
      onLinkClick={collapseSearch}
      renderBody={() => (
        <React.Fragment>
          {description ? <div dangerouslySetInnerHTML={{ __html: description }} /> : null}
          {highlightedLS(result, 'synthesis_title', locale) ? (
            <div>
              <div dangerouslySetInnerHTML={{ __html: synthesisTitle }} />
              <p>
                <Translate value="search.search_come_from_what_you_need_to_know" />
              </p>
            </div>
          ) : null}
          {highlightedLS(result, 'announcement_title', locale) || highlightedLS(result, 'announcement_body', locale) ? (
            <div>
              {/* <div dangerouslySetInnerHTML={{ __html: announceTitle }} /> */}
              <div dangerouslySetInnerHTML={{ __html: announceBody }} />
              <p>
                <Translate value="search.search_come_from_announcement" />
              </p>
            </div>
          ) : null}
        </React.Fragment>
      )}
      renderFooter={() => (
        <React.Fragment>
          {source.num_posts}
          <span className={bemBlocks.item('assembl-icon-message')}>
            <span className="assembl-icon-message" title={I18n.t('search.number_of_contributions')} />
          </span>
          {source.num_contributors}
          <span className={bemBlocks.item('assembl-icon-avatar')}>
            <span className="assembl-icon-profil" title={I18n.t('search.number_of_users')} />
          </span>
        </React.Fragment>
      )}
    />
  );
};

const DumbHitItem = (props) => {
  switch (props.result._type) {
  case 'synthesis':
    return <SynthesisHit {...props} />;
  case 'user':
    return <UserHit {...props} />;
  case 'idea':
    return <IdeaHit {...props} />;
  case 'extract':
    return <ExtractHit {...props} />;
  default:
    // post
    return <PostHit {...props} />;
  }
};

const mapLocaleToProps = state => ({ locale: getLocale(state) });
const HitItem = connect(mapLocaleToProps)(DumbHitItem);

const NoPanel = props => <div>{props.children}</div>;

const calcQueryFields = () => {
  const base = [
    'body', // extract
    'name', // user
    'creator_display_name' // extract, post
  ];
  const lsFields = [
    'announcement_title', // idea announcement
    'announcement_body', // idea announcement
    'title', // idea
    'description', // idea
    'synthesis_title', // idea
    'body', // post
    'subject', // post & synthesis
    'introduction', // synthesis
    'conclusion', // synthesis
    'ideas' // synthesis
  ];
  const langs = elasticsearchLangIndexes.slice();
  langs.push('other');
  langs.forEach((lang) => {
    lsFields.forEach((field) => {
      base.push(`${field}_${lang}`);
    });
  });
  return base;
};

const queryFields = calcQueryFields();

// default is fragment_size 100 and number_of_fragments 5,see
// https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-highlighting.html#_highlighted_fragments
const customHighlight = {
  fields: {
    body_other: { fragment_size: FRAGMENT_SIZE, number_of_fragments: 1 }
  }
};
// setting it for body_other field seems to apply the setting to all queryFields

export class SearchComponent extends React.Component {
  constructor(props) {
    super(props);
    const host = '/';
    this.searchkit = new SearchkitManager(host, { searchOnLoad: false, useHistory: false });
    this.searchkit.setQueryProcessor((plainQueryObject) => {
      // rewrite the query to filter on the current discussion
      const modifiedQuery = plainQueryObject;
      const filters = [];
      // we need to rewrite the query as a bool query to be compatible ES 5
      if (modifiedQuery.filter) {
        // modifiedQuery.filter is always an Object,
        // it's a range filter for example
        // or a bool must when there is more than 1 filter
        filters.push(modifiedQuery.filter);
        delete modifiedQuery.filter;
      }
      filters.push({ term: { discussion_id: props.discussionId } });
      let simpleQueryString;
      if (modifiedQuery.query) {
        simpleQueryString = modifiedQuery.query.simple_query_string;
        delete modifiedQuery.query.simple_query_string;
      }
      modifiedQuery.query = { bool: { filter: filters } };
      modifiedQuery.query.bool.must = [];
      if (simpleQueryString) {
        this.setState({ show: true, queryString: simpleQueryString.query });
        simpleQueryString.query = `${simpleQueryString.query}*`;
        modifiedQuery.query.bool.must.push({ simple_query_string: simpleQueryString });
      } else {
        this.setState({ queryString: null });
      }
      if (Object.prototype.hasOwnProperty.call(modifiedQuery.sort[0], 'num_posts')) {
        modifiedQuery.sort[0] = { _score: modifiedQuery.sort[0].num_posts.order };
        modifiedQuery.query.bool.must.push({
          has_child: {
            type: 'post',
            score_mode: 'sum',
            query: {
              function_score: {
                query: { bool: { filter: { term: { discussion_id: props.discussionId } } } },
                script_score: {
                  script: '1'
                }
              }
            }
          }
        });
      }
      return modifiedQuery;
    });
    const translate = I18n.t.bind(I18n);
    this.searchkit.translateFunction = key => translate(`search.${key}`);
    this.state = { show: false, queryString: null };
  }

  collapseSearch = () => {
    this.setState({ show: false }, () => {
      this.resetFilters.accessor.performReset();
      this.searchbox.forceUpdate();
    });
  };

  render() {
    const { isExpert, connectedUserId, discussionId } = this.props;
    let extractsSelected = false;
    let messagesSelected = false;
    let usersSelected = false;
    let selectedCategory = 'All';
    if (this.searchkit.state && this.searchkit.state.type) {
      messagesSelected = this.searchkit.state.type.indexOf('post') >= 0;
      usersSelected = this.searchkit.state.type.indexOf('user') >= 0;
      extractsSelected = this.searchkit.state.type.indexOf('extract') >= 0;
      if (this.searchkit.state.type.length > 0) {
        selectedCategory = this.searchkit.state.type[0];
      }
    }
    let sorts = [
      { label: 'By relevance', key: 'common:relevance_desc', field: '_score', order: 'desc', defaultOption: true },
      { label: 'Most recent first', key: 'common:creation_date_desc', field: 'creation_date', order: 'desc' },
      { label: 'Oldest first', key: 'common:creation_date_asc', field: 'creation_date', order: 'asc' }
    ];
    sorts = sorts.concat([
      {
        label: 'Most popular messages',
        key: 'post:popularity_desc',
        fields: [
          { field: 'sentiment_counts.popularity', options: { order: 'desc' } },
          { field: 'creation_date', options: { order: 'desc' } }
        ]
      },
      {
        label: 'Less popular messages',
        key: 'post:popularity_asc',
        fields: [
          { field: 'sentiment_counts.popularity', options: { order: 'asc' } },
          { field: 'creation_date', options: { order: 'desc' } }
        ]
      },
      {
        label: 'Most controversial messages',
        key: 'post:controversy_desc',
        fields: [
          { field: 'sentiment_counts.controversy', options: { order: 'asc' } },
          { field: 'sentiment_counts.total', options: { order: 'desc' } },
          { field: 'creation_date', options: { order: 'desc' } }
        ]
      },
      {
        label: 'Most consensus messages',
        key: 'post:consensus_desc',
        fields: [
          { field: 'sentiment_counts.consensus', options: { order: 'asc' } },
          { field: 'sentiment_counts.total', options: { order: 'desc' } },
          { field: 'creation_date', options: { order: 'desc' } }
        ]
      },
      {
        label: 'Messages judged unclear',
        key: 'post:unclear_desc',
        fields: [
          { field: 'sentiment_counts.dont_understand', options: { order: 'desc' } },
          { field: 'creation_date', options: { order: 'desc' } }
        ]
      }
    ]);
    sorts = sorts.concat([
      {
        label: 'Participants having the most posted messages',
        key: 'user:messages_desc',
        fields: [{ field: 'num_posts', options: { order: 'desc' } }]
      },
      {
        label: 'Participants having the less posted messages',
        key: 'user:messages_asc',
        fields: [{ field: 'num_posts', options: { order: 'asc' } }]
      }
    ]);
    return (
      <SearchkitProvider searchkit={this.searchkit}>
        <Layout size="l">
          <TopBar>
            <SearchBox
              autofocus={false}
              searchOnChange
              searchThrottleTime={500}
              queryFields={queryFields}
              ref={(el) => {
                this.searchbox = el;
              }}
            />
          </TopBar>
          <LayoutBody className={!this.state.show ? 'hidden' : null}>
            <SideBar>
              <ResetFilters
                ref={(el) => {
                  this.resetFilters = el;
                }}
              />
              {/* <SelectedFilters /> */}
              <MenuFilterCustomAll
                listComponent={CheckboxItemList}
                field="_type"
                id="type"
                title={I18n.t('search.Categories')}
                include={isExpert ? ['post', 'user', 'idea', 'extract', 'synthesis'] : ['post', 'user', 'idea', 'synthesis']}
              />
              <Panel title={I18n.t('search.Messages')} className={messagesSelected ? null : 'hidden'}>
                <MenuFilter
                  containerComponent={NoPanel}
                  listComponent={CheckboxItemList}
                  field="sentiment_tags"
                  id="sentiment_tags"
                  title={I18n.t('search.Messages')}
                />
                {connectedUserId ? (
                  <div className="sk-panel">
                    <CheckboxFilter
                      containerComponent={NoPanel}
                      id="mymessages"
                      title={I18n.t('search.My messages')}
                      label={I18n.t('search.My messages')}
                      filter={TermQuery('creator_id', connectedUserId)}
                    />
                    <CheckboxFilter
                      containerComponent={NoPanel}
                      id="messages-in-response"
                      title={I18n.t('search.Messages in response to my contributions')}
                      label={I18n.t('search.Messages in response to my contributions')}
                      filter={TermQuery('parent_creator_id', connectedUserId)}
                    />
                  </div>
                ) : null}
              </Panel>
              <Panel title={I18n.t('search.Extracts')} className={extractsSelected ? null : 'hidden'}>
                {isExpert && (
                  <div className="sk-panel">
                    <MenuFilter
                      listComponent={CheckboxItemList}
                      field="extract_state"
                      id="extract_state"
                      title={I18n.t('search.State')}
                    />
                    <MenuFilter
                      listComponent={CheckboxItemList}
                      field="extract_nature"
                      id="extract_nature"
                      title={I18n.t('search.Nature')}
                    />
                    <MenuFilter
                      listComponent={CheckboxItemList}
                      field="extract_action"
                      id="extract_action"
                      title={I18n.t('search.Action')}
                    />
                  </div>
                )}
              </Panel>
              {isExpert ? (
                <Panel title={I18n.t('search.Participants')} className={usersSelected ? null : 'hidden'}>
                  <CheckboxFilter
                    containerComponent={NoPanel}
                    id="creative-participants"
                    title={I18n.t('search.Creative participants')}
                    label={I18n.t('search.Creative participants')}
                    filter={HasChildQuery(
                      'post',
                      BoolMust([TermQuery('discussion_id', discussionId), TermQuery('parent_id', 0)])
                    )}
                  />
                  <CheckboxFilter
                    containerComponent={NoPanel}
                    id="reactive-participants"
                    title={I18n.t('search.Reactive participants')}
                    label={I18n.t('search.Reactive participants')}
                    filter={BoolMust([
                      HasChildQuery(
                        'post',
                        BoolMust([TermQuery('discussion_id', discussionId), RangeQuery('parent_id', { gt: 0 })])
                      ),
                      BoolMustNot(
                        HasChildQuery('post', BoolMust([TermQuery('discussion_id', discussionId), TermQuery('parent_id', 0)]))
                      )
                    ])}
                  />
                  <CheckboxFilter
                    containerComponent={NoPanel}
                    id="learning-participants"
                    title={I18n.t('search.Learning participants')}
                    label={I18n.t('search.Learning participants')}
                    filter={BoolMustNot([HasChildQuery('post', TermQuery('discussion_id', discussionId))])}
                  />
                  <CheckboxFilter
                    containerComponent={NoPanel}
                    id="participants-peers"
                    title={I18n.t('search.Participants pleased by their peers')}
                    label={I18n.t('search.Participants pleased by their peers')}
                    filter={HasChildQuery(
                      'post',
                      BoolMust([TermQuery('discussion_id', discussionId), RangeQuery('sentiment_counts.like', { gt: 0 })])
                    )}
                  />
                </Panel>
              ) : null}
              <TagFilterConfig id="creator_id" title="Participant" field="creator_id" />
              <Panel title={I18n.t('search.Sort')}>
                <FilteredSortingSelector options={sorts} filterPrefix={selectedCategory} listComponent={CheckboxItemList} />
              </Panel>
              <RangeFilter
                field="creation_date"
                id="creation_date"
                title={I18n.t('search.Filter by date')}
                rangeComponent={DateRangeFilter}
                min={946684800000}
                max={new Date().getTime()}
              />
            </SideBar>
            <LayoutResults>
              <ActionBar>
                <button className="btn btn-default btn-sm right" id="search-expand" onClick={this.collapseSearch}>
                  <Translate value="search.collapse_search" />
                </button>
                <ActionBarRow>
                  <HitsStats />
                </ActionBarRow>
              </ActionBar>
              <HitsWithScrollTop
                hitsPerPage={5}
                highlightFields={queryFields}
                customHighlight={customHighlight}
                itemComponent={props => <HitItem collapseSearch={this.collapseSearch} {...props} />}
                mod="sk-hits-list"
              />
              <InitialLoader />
              <Pagination showNumbers />
            </LayoutResults>
          </LayoutBody>
        </Layout>
      </SearchkitProvider>
    );
  }
}

const mapStateToProps = state => ({
  isExpert: connectedUserIsExpert(),
  connectedUserId: getConnectedUserId(state),
  discussionId: getDebateId(state)
});

const ConnectedSearch = connect(mapStateToProps)(SearchComponent);

export { DumbExtractHit, IdeaHit, PostHit, SynthesisHit, UserHit };

export default ConnectedSearch;