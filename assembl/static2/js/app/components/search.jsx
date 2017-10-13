/* eslint no-underscore-dangle: 0, max-len: ["warn", 136] */
/* global __resourceQuery */
import React from 'react';
import { Localize, Translate, I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';

import {
  ActionBar,
  ActionBarRow,
  BoolMust,
  BoolMustNot,
  CheckboxFilter,
  CheckboxItemList,
  HasChildQuery,
  Hits,
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
  // SelectedFilters,
  SideBar,
  TagFilterConfig,
  TagFilter,
  TermQuery,
  TopBar
} from 'searchkit';
import get from 'lodash/get';
import truncate from 'lodash/truncate';

import DateRangeFilter from './search/DateRangeFilter';
import FilteredSortingSelector from './search/SortingSelector';
import ProfileLine from './common/profileLine';
import { getConnectedUserId, getDebateId, getLocale } from '../reducers/contextReducer';
import { connectedUserIsExpert } from '../utils/permissions';

const FRAGMENT_SIZE = 400;
const elasticsearchLangIndexes = document.getElementById('elasticsearchLangIndexes').value.split(' ');

const truncateText = (text) => {
  return truncate(text, { length: FRAGMENT_SIZE, separator: ' ', omission: ' [...]' });
};

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

let Link;
let getUrl;
if (__resourceQuery) {
  // v1
  // const querystring = require('querystring');
  // const params = querystring.parse(__resourceQuery.slice(1));
  // if (params.v === '1') {
  Link = (props) => {
    return <a href={props.to} dangerouslySetInnerHTML={props.dangerouslySetInnerHTML} />;
  };
  getUrl = (hit) => {
    const slug = document.getElementById('discussion-slug').value;
    const id = hit._source.id;
    switch (hit._type) {
    case 'synthesis':
      return `${slug}/posts/local:Content/${id}`;
    case 'user':
      return undefined;
    case 'idea':
      return `${slug}/idea/local:Idea/${id}`;
    default:
      // post
      return `${slug}/posts/local:Content/${id}`;
    }
  };
  // }
} else {
  // Link = require('react-router').Link; // eslint-disable-line
  Link = (props) => {
    return <a href={props.to} dangerouslySetInnerHTML={props.dangerouslySetInnerHTML} />;
  };
  const slug = document.getElementById('discussion-slug').value;
  getUrl = (hit) => {
    const id = hit._source.id;
    let ideaBase64id;
    let postBase64id;
    let ideaId;
    switch (hit._type) {
    case 'synthesis':
      return undefined;
    case 'user':
      return undefined;
    case 'idea':
      ideaBase64id = btoa(`Idea:${id}`);
      return `/${slug}/debate/thread/theme/${ideaBase64id}`;
    default:
      // post
      ideaId = hit._source.idea_id.length > 0 ? hit._source.idea_id[0] : null;
      if (!ideaId) {
        return undefined;
      }
      ideaBase64id = btoa(`Idea:${ideaId}`);
      postBase64id = btoa(`Post:${id}`);
      return `/${slug}/debate/thread/theme/${ideaBase64id}/#${postBase64id}`;
    }
  };
}

const PublishedInfo = (props) => {
  const { date, userId, userName, className } = props;
  return (
    <div className={className}>
      <Translate value="search.published_on" /> <Localize value={date} dateFormat="date.format" /> <Translate value="search.by" />{' '}
      <TagFilter key={userId} field="creator_id" value={userId}>
        <ProfileLine userId={userId} userName={userName} />
      </TagFilter>
    </div>
  );
};

const TYPE_TO_ICON = {
  user: 'profil',
  post: 'discussion',
  idea: 'idea',
  synthesis: 'synthesis'
};

const ImageType = (props) => {
  return <span className={`${props.className} assembl-icon-${TYPE_TO_ICON[props.type]}`} />;
};

const getFieldAnyLang = (source, prop, locale) => {
  let result;
  if (!source) {
    // Why does this happen?
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

const highlightedLSOrTruncatedLS = (hit, field, locale) => {
  let text = getFieldAnyLang(hit.highlight, field, locale);
  if (text) {
    if (Array.isArray(text)) {
      // take the first highlight fragment
      text = text[0];
    }
    return text;
  }

  text = getFieldAnyLang(hit._source, field, locale);
  if (text) {
    return truncateText(text);
  }
  return '';
};

const DumbPostHit = (props) => {
  const locale = props.locale;
  const source = props.result._source;
  const subject = highlightedLSOrTruncatedLS(props.result, 'subject', locale);
  const body = highlightedLSOrTruncatedLS(props.result, 'body', locale);
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <ImageType type={props.result._type} className={props.bemBlocks.item('imgtype')} />
      <div className={props.bemBlocks.item('title')}>
        <Link to={getUrl(props.result)} dangerouslySetInnerHTML={{ __html: subject }} />
      </div>
      <div className={props.bemBlocks.item('content')}>
        <p dangerouslySetInnerHTML={{ __html: body }} />
        <div>
          <div title={I18n.t('search.like')} className="emoticon LikeSentimentOfPost" />
          <div className="emoticonValue">
            {source.sentiment_counts.like}
          </div>
          <div title={I18n.t('search.disagree')} className="emoticon DisagreeSentimentOfPost" />
          <div className="emoticonValue">
            {source.sentiment_counts.disagree}
          </div>
          <div title={I18n.t('search.dont_understand')} className="emoticon DontUnderstandSentimentOfPost" />
          <div className="emoticonValue">
            {source.sentiment_counts.dont_understand}
          </div>
          <div title={I18n.t('search.more_info')} className="emoticon MoreInfoSentimentOfPost" />
          <div className="emoticonValue">
            {source.sentiment_counts.more_info}
          </div>
        </div>
      </div>
      <PublishedInfo
        className={props.bemBlocks.item('info')}
        date={source.creation_date}
        userId={source.creator_id}
        userName={source.creator_name}
      />
    </div>
  );
};

const PostHit = connect((state) => {
  return { locale: getLocale(state) };
})(DumbPostHit);

const DumbSynthesisHit = (props) => {
  const locale = props.locale;
  const source = props.result._source;
  const ideas = highlightedLSOrTruncatedLS(props.result, 'ideas', locale);
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <ImageType type={props.result._type} className={props.bemBlocks.item('imgtype')} />
      <div className={props.bemBlocks.item('title')}>
        <Link
          to={getUrl(props.result)}
          dangerouslySetInnerHTML={{ __html: highlightedTextOrTruncatedText(props.result, 'subject') }}
        />
      </div>
      <div className={props.bemBlocks.item('content')}>
        <p
          style={{ backgroundColor: '#f4f4f4' }}
          dangerouslySetInnerHTML={{ __html: highlightedTextOrTruncatedText(props.result, 'introduction') }}
        />
        {ideas ? <p style={{ paddingLeft: '1em', marginTop: '1em' }} dangerouslySetInnerHTML={{ __html: ideas }} /> : null}
        <p
          style={{ backgroundColor: '#f4f4f4', marginTop: '1em' }}
          dangerouslySetInnerHTML={{ __html: highlightedTextOrTruncatedText(props.result, 'conclusion') }}
        />
      </div>
      <PublishedInfo
        className={props.bemBlocks.item('info')}
        date={source.creation_date}
        userId={source.creator_id}
        userName={source.creator_name}
      />
    </div>
  );
};

const SynthesisHit = connect((state) => {
  return { locale: getLocale(state) };
})(DumbSynthesisHit);

const UserHit = (props) => {
  const source = props.result._source;
  const url = getUrl(props.result);
  const fullname = get(props.result, 'highlight.name', props.result._source.name);
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <ImageType type={props.result._type} className={props.bemBlocks.item('imgtype')} />
      <div className={props.bemBlocks.item('title')}>
        {url
          ? <Link to={getUrl(props.result)} dangerouslySetInnerHTML={{ __html: fullname }} />
          : <p dangerouslySetInnerHTML={{ __html: fullname }} />}
      </div>
      <div className={props.bemBlocks.item('info')}>
        {source.num_posts}
        <span className={props.bemBlocks.item('assembl-icon-message')}>
          <span className="assembl-icon-message" title="Number of contributions" />
        </span>
        {source.creation_date
          ? <span>
            <Translate value="search.member_since" /> <Localize value={source.creation_date} dateFormat="date.format" />
          </span>
          : null}
      </div>
    </div>
  );
};

const DumbIdeaHit = (props) => {
  const locale = props.locale;
  const source = props.result._source;
  const shortTitle = highlightedLSOrTruncatedLS(props.result, 'title', locale);
  const definition = highlightedLSOrTruncatedLS(props.result, 'description', locale);
  // long title missing?
  const announceTitle = highlightedLSOrTruncatedLS(props.result, 'announcement_title', locale);
  const announceBody = highlightedLSOrTruncatedLS(props.result, 'announcement_body', locale);

  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <ImageType type={props.result._type} className={props.bemBlocks.item('imgtype')} />
      <div className={props.bemBlocks.item('title')}>
        <Link to={getUrl(props.result)} dangerouslySetInnerHTML={{ __html: shortTitle }} />
      </div>
      <div className={props.bemBlocks.item('content')}>
        {definition
          ? <div>
            <p dangerouslySetInnerHTML={{ __html: definition }} />
            {get(props.result, 'highlight.definition') &&
            <p>
              <Translate value="search.search_come_from_what_you_need_to_know" />
            </p>}
          </div>
          : null}
        {get(props.result, 'highlight.title') || get(props.result, 'highlight.body')
          ? <div>
            <p dangerouslySetInnerHTML={{ __html: announceTitle }} />
            <p dangerouslySetInnerHTML={{ __html: announceBody }} />
            <p>
              <Translate value="search.search_come_from_announcement" />
            </p>
          </div>
          : null}
      </div>
      <div className={props.bemBlocks.item('info')}>
        {source.num_posts}
        <span className={props.bemBlocks.item('assembl-icon-message')}>
          <span className="assembl-icon-message" title="Number of contributions" />
        </span>
        {source.num_contributors}
        <span className={props.bemBlocks.item('assembl-icon-avatar')}>
          <span className="assembl-icon-profil" title="Number of users" />
        </span>
      </div>
    </div>
  );
};

const IdeaHit = connect((state) => {
  return { locale: getLocale(state) };
})(DumbIdeaHit);

const HitItem = (props) => {
  switch (props.result._type) {
  case 'synthesis':
    return <SynthesisHit {...props} />;
  case 'user':
    return <UserHit {...props} />;
  case 'idea':
    return <IdeaHit {...props} />;
  default:
    // post
    return <PostHit {...props} />;
  }
};

const NoPanel = (props) => {
  return (
    <div>
      {props.children}
    </div>
  );
};

const calcQueryFields = () => {
  const base = [
    'name', // user
    'subject', // synthesis
    'introduction', // synthesis
    'conclusion' // synthesis
  ];
  const lsFields = [
    'announcement_title', // idea announcement
    'announcement_body', // idea announcement
    'title', // idea
    'description', // idea
    'synthesis_title', // idea
    'ideas', // synthesis
    'subject', // post
    'body' // post
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
    this.searchkit.translateFunction = (key) => {
      return translate(`search.${key}`);
    };
    this.state = { show: false, queryString: null };
  }

  render() {
    const { isExpert, connectedUserId, discussionId } = this.props;
    let messagesSelected = false;
    let usersSelected = false;
    let selectedCategory = 'All';
    if (this.searchkit.state) {
      messagesSelected = this.searchkit.state.type.indexOf('post') >= 0;
      usersSelected = this.searchkit.state.type.indexOf('user') >= 0;
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
              <ResetFilters />
              {/* <SelectedFilters /> */}
              <MenuFilter listComponent={CheckboxItemList} field="_type" id="type" title={I18n.t('search.Categories')} />
              <Panel title={I18n.t('search.Messages')} className={messagesSelected ? null : 'hidden'}>
                <MenuFilter
                  containerComponent={NoPanel}
                  listComponent={CheckboxItemList}
                  field="sentiment_tags"
                  id="sentiment_tags"
                  title={I18n.t('search.Messages')}
                />
                {connectedUserId
                  ? <div className="sk-panel">
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
                  : null}
              </Panel>
              {isExpert
                ? <Panel title={I18n.t('search.Participants')} className={usersSelected ? null : 'hidden'}>
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
                : null}
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
                <button
                  className="btn btn-default btn-sm right"
                  id="search-expand"
                  onClick={() => {
                    this.setState({ show: false }, () => {
                      this.searchbox.accessor.setQueryString(null);
                      this.searchbox.forceUpdate();
                    });
                  }}
                >
                  <Translate value="search.collapse_search" />
                </button>
                <ActionBarRow>
                  <HitsStats />
                </ActionBarRow>
              </ActionBar>
              <Hits
                hitsPerPage={5}
                highlightFields={queryFields}
                customHighlight={customHighlight}
                itemComponent={HitItem}
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

const mapStateToProps = (state) => {
  return {
    isExpert: connectedUserIsExpert(),
    connectedUserId: getConnectedUserId(state),
    discussionId: getDebateId(state)
  };
};

const ConnectedSearch = connect(mapStateToProps)(SearchComponent);
export default ConnectedSearch;