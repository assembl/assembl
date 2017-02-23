/* eslint no-underscore-dangle: 0, react/no-danger: 0 */
/* global __resourceQuery */
import React from 'react';
import { Localize, Translate, I18n } from 'react-redux-i18n';
import styled from 'styled-components';

import {
  MenuFilter,
  Panel,
  RangeFilter,
  SearchBox,
  SortingSelector,
  Hits,
  HitsStats,
  Pagination,
  ResetFilters,
  // SelectedFilters,
  SearchkitProvider,
  SearchkitManager,
  ItemList,
//   NoHits,
   InitialLoader,
   Layout, LayoutBody, LayoutResults,
   SideBar,
   TopBar,
   ActionBar, ActionBarRow
} from 'searchkit';
import get from 'lodash/get';
import truncate from 'lodash/truncate';

// Keep the style import here. The reason why it's not in main.scss is because
// we create a searchv1 bundle that includes only the Search component and its
// local styles for v1. There is an additional searchv1.scss file that overrides
// some styles for v1

import '../../../css/views/search.scss';
import colors from '!!sass-variable-loader!../../../css/variables.scss'; // eslint-disable-line

import GlobalFunctions from '../utils/globalFunctions';
import DateRangeFilter from './search/DateRangeFilter';
import Avatar from './common/Avatar';

const FRAGMENT_SIZE = 400;

const highlightedTextOrTruncatedText = (hit, field, options = { omission: ' [...]' }) => {
  let text = get(hit, `highlight.${field}`);
  if (text) {
    if (Array.isArray(text)) {
      // take the first highlight fragment
      text = text[0];
    }
    return text;
  }

  text = truncate(hit._source[field],
    { length: FRAGMENT_SIZE, separator: ' ', omission: options.omission });
  return text;
};

let Link;
let getUrl;
if (__resourceQuery) { // v1
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
    default: // post
      return `${slug}/posts/local:Content/${id}`;
    }
  };
  // }
} else {
  Link = require('react-router').Link;  // eslint-disable-line
  getUrl = (hit) => {
    const id = hit._source.id;
    switch (hit._type) {
    case 'synthesis':
      return `posts/${id}`;
    case 'user':
      return `profile/${id}`;
    case 'idea':
      return `ideas/${id}`;
    default: // post
      return `posts/${id}`;
    }
  };
}

// TODO get the right subject highlight, fr, en in priority, then fallback to und(efined). Same for body obviously.

const RowInFirstColor = styled.div`
color: ${colors.firstColor};
`;

const PublishedInfo = (props) => {
  const { date, userId, userName } = props;
  return (
    <RowInFirstColor>
      <Translate value="search.published_the" />{' '}<Localize value={date} dateFormat="date.format" />
      {' '}<Translate value="search.by" />{' '}
      <Avatar userId={userId} userName={userName} />
    </RowInFirstColor>
  );
};

const PostHit = (props) => {
  const source = props.result._source;
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <div className={props.bemBlocks.item('title')}>
        <Link
          to={getUrl(props.result)}
          dangerouslySetInnerHTML={{ __html: get(props.result, 'highlight.subject_und', source.subject_und) }}
        />
      </div>
      <div className={props.bemBlocks.item('content')}>
        <p dangerouslySetInnerHTML={{ __html: highlightedTextOrTruncatedText(props.result, 'body_und') }} />
      </div>
      <PublishedInfo date={source.creation_date} userId={source.creator_id} userName={source.creator_name} />
    </div>
  );
};

const SynthesisHit = (props) => {
  const source = props.result._source;
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <div className={props.bemBlocks.item('title')}>
        <Link
          to={getUrl(props.result)}
          dangerouslySetInnerHTML={{ __html: highlightedTextOrTruncatedText(props.result, 'subject') }}
        />
      </div>
      <div className={props.bemBlocks.item('content')}>
        <p dangerouslySetInnerHTML={{ __html: highlightedTextOrTruncatedText(props.result, 'introduction') }} />
        <p dangerouslySetInnerHTML={{ __html: highlightedTextOrTruncatedText(props.result, 'conclusion') }} />
      </div>
      <PublishedInfo date={source.creation_date} userId={source.creator_id} userName={source.creator_name} />
    </div>
  );
};


const UserHit = (props) => {
  const source = props.result._source;
  const url = getUrl(props.result);
  const fullname = get(
    props.result, 'highlight.name', props.result._source.name);
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <div className={props.bemBlocks.item('title')}>
        { url ?
          <Link
            to={getUrl(props.result)}
            dangerouslySetInnerHTML={{ __html: fullname }}
          />
        :
          <p dangerouslySetInnerHTML={{ __html: fullname }} />
        }
      </div>
      <PublishedInfo date={source.creation_date} userId={source.creator_id} userName={source.creator_name} />
    </div>
  );
};

const IdeaHit = (props) => {
  const source = props.result._source;
  const shortTitle = highlightedTextOrTruncatedText(props.result, 'short_title');
  const definition = highlightedTextOrTruncatedText(props.result, 'definition');
  const announceTitle = highlightedTextOrTruncatedText(props.result, 'title');
  const announceBody = highlightedTextOrTruncatedText(props.result, 'body');
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <div className={props.bemBlocks.item('title')}>
        <Link
          to={getUrl(props.result)}
          dangerouslySetInnerHTML={{ __html: shortTitle }}
        />
      </div>
      <div className={props.bemBlocks.item('content')}>
        { definition ?
          <div>
            <p dangerouslySetInnerHTML={{ __html: definition }} />
            { get(props.result, 'highlight.definition') && <p><Translate value="search.search_come_from_what_you_need_to_know" /></p> }
          </div>
          : null
        }
        { get(props.result, 'highlight.title') || get(props.result, 'highlight.body') ?
          <div>
            <p dangerouslySetInnerHTML={{ __html: announceTitle }} />
            <p dangerouslySetInnerHTML={{ __html: announceBody }} />
            <p><Translate value="search.search_come_from_announcement" /></p>
          </div>
          : null
        }
      </div>
      <div>
        <Translate value="search.stats.x_messages" count={source.num_posts} />, <Translate value="search.stats.x_contributors" count={source.num_contributors} />
      </div>
    </div>
  );
};

const HitItem = (props) => {
  switch (props.result._type) {
  case 'synthesis':
    return SynthesisHit(props);
  case 'user':
    return UserHit(props);
  case 'idea':
    return IdeaHit(props);
  default: // post
    return PostHit(props);
  }
};

const queryFields = [
  'title',  // idea announcement
  'body',  // idea announcement
  'short_title',  // idea
  'definition',  // idea
  'name',  // user
  'subject',  // synthesis
  'introduction',  // synthesis
  'conclusion',  // synthesis
  'subject_und', // post
  'subject_fr', // post
  'subject_en', // post
  'body_und', // post
  'body_fr', // post
  'body_en' // post
];

// default is fragment_size 100 and number_of_fragments 5,see
// https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-highlighting.html#_highlighted_fragments
const customHighlight = {
  fields: {
    body: { fragment_size: FRAGMENT_SIZE, number_of_fragments: 1 }
  }
};
// setting it for body field seems to apply the setting to all queryFields

export default class Search extends React.Component {

  constructor() {
    super();
    const discussionId = GlobalFunctions.getDiscussionId();
    const host = '/';
    this.searchkit = new SearchkitManager(host, { searchOnLoad: false });
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
      filters.push({ term: { discussion_id: discussionId } });
      let simpleQueryString;
      if (modifiedQuery.query) {
        simpleQueryString = modifiedQuery.query.simple_query_string;
        delete modifiedQuery.query.simple_query_string;
      }
      modifiedQuery.query = { bool: { filter: filters } };
      if (simpleQueryString) {
        this.setState({ show: true, queryString: simpleQueryString.query });
        simpleQueryString.query = `${simpleQueryString.query}*`;
        modifiedQuery.query.bool.must = [
          { simple_query_string: simpleQueryString }
        ];
      } else {
        this.setState({ queryString: null });
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
    return (
      <SearchkitProvider searchkit={this.searchkit}>
        <Layout size="l">
          <TopBar>
            <SearchBox
              autofocus={false}
              searchOnChange
              searchThrottleTime={500}
              queryFields={queryFields}
            />
            { this.state.show || (!this.state.show && this.state.queryString) ?
              <button
                className="btn btn-default btn-sm" id="search-expand"
                onClick={() => {
                  this.setState({ show: !this.state.show }, () => {
                    if (this.state.show && !this.searchkit.hasHits()) {
                      this.searchkit.reloadSearch();
                    }
                  });
                }}
              >
                {this.state.show ? <Translate value="search.collapse_search" /> : null}
                {!this.state.show && this.state.queryString ? I18n.t('search.expand_search') : null}
              </button>
            : null }
          </TopBar>
          <LayoutBody className={!this.state.show ? 'hidden' : null}>
            <SideBar>
              <ResetFilters />
              {/* <SelectedFilters /> */}
              <MenuFilter
                field="_type"
                id="type"
                title={I18n.t('search.Categories')}
              />
              <Panel title={I18n.t('search.Sort')}>
                <SortingSelector
                  options={[
                    { label: 'By relevance', field: '_score', order: 'desc', defaultOption: true },
                    { label: 'More recent first', field: 'creation_date', order: 'desc' },
                    { label: 'Oldest first', field: 'creation_date', order: 'asc' }
                  ]}
                  listComponent={ItemList}
                />
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