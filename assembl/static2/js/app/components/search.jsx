/* eslint no-underscore-dangle: 0, react/no-danger: 0 */
/* global __resourceQuery */
import React from 'react';

import {
  MenuFilter,
  // DynamicRangeFilter,
  SearchBox,
  Hits,
  HitsStats,
  Pagination,
  ResetFilters,
  SelectedFilters,
  SearchkitProvider,
  SearchkitManager,
//   NoHits,
   InitialLoader,
   Layout, LayoutBody, LayoutResults,
   SideBar,
   TopBar,
   ActionBar, ActionBarRow
} from 'searchkit';
import get from 'lodash/get';

// Keep the style import here. The reason why it's not in main.scss is because
// we create a searchv1 bundle that includes only the Search component and its
// local styles for v1. There is an additional searchv1.scss file that overrides
// some styles for v1
import 'searchkit/theming/theme.scss';
import '../../../css/views/search.scss';

import GlobalFunctions from '../utils/globalFunctions';
import Translations from '../utils/translations';

const truncate = (text) => {
  if (!text) {
    return '';
  }
  let modifiedText = text;
  if (Array.isArray(text)) {
    // take the first highlight fragment
    modifiedText = text[0];
  }
  modifiedText = modifiedText.substring(0, 400);
  return modifiedText;
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
// TODO pagination component doesn't seem to work
// TODO translations fr/en
// TODO issue with sidebar range filter, it sometime disappears
// (when there is only 1 result), and the selected range is not kept (maybe because of the date field...)

const PostHit = (props) => {
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <div className={props.bemBlocks.item('title')}>
        <Link
          to={getUrl(props.result)}
          dangerouslySetInnerHTML={{ __html: get(props.result, 'highlight.subject_und', props.result._source.subject_und) }}
        />
      </div>
      <div className={props.bemBlocks.item('content')}>
        <p dangerouslySetInnerHTML={{ __html: truncate(get(props.result, 'highlight.body_und', props.result._source.body_und)) }} />
      </div>
      <div className={props.bemBlocks.item('date')}>
        { `Publié le ${props.result._source.creation_date}` }
      </div>
    </div>
  );
};

const SynthesisHit = (props) => {
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <div className={props.bemBlocks.item('title')}>
        <Link
          to={getUrl(props.result)}
          dangerouslySetInnerHTML={{ __html: get(props.result, 'highlight.subject', props.result._source.subject) }}
        />
      </div>
      <div className={props.bemBlocks.item('content')}>
        <p dangerouslySetInnerHTML={{ __html: truncate(get(props.result, 'highlight.introduction', props.result._source.introduction)) }} />
        <p dangerouslySetInnerHTML={{ __html: truncate(get(props.result, 'highlight.conclusion', props.result._source.conclusion)) }} />
      </div>
      <div className={props.bemBlocks.item('date')}>
        { `Publié le ${props.result._source.creation_date}` }
      </div>
    </div>
  );
};

const UserHit = (props) => {
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
      <div className={props.bemBlocks.item('date')}>
        { `Membre depuis le ${props.result._source.creation_date}` }
      </div>
    </div>
  );
};

const IdeaHit = (props) => {
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <div className={props.bemBlocks.item('title')}>
        <Link
          to={getUrl(props.result)}
          dangerouslySetInnerHTML={{ __html: get(props.result, 'highlight.short_title', props.result._source.short_title) }}
        />
      </div>
      <div className={props.bemBlocks.item('content')}>
        { get(props.result, 'highlight.definition') ?
          <div>
            <p dangerouslySetInnerHTML={{ __html: truncate(get(props.result, 'highlight.definition', props.result._source.definition)) }} />
            <p>{ 'Recherche effectuée dans la section "à retenir" de la discussion' }</p>
          </div>
          : null
        }
        { get(props.result, 'highlight.title') || get(props.result, 'highlight.body') ?
          <div>
            <p dangerouslySetInnerHTML={{ __html: truncate(get(props.result, 'highlight.title', props.result._source.title)) }} />
            <p dangerouslySetInnerHTML={{ __html: truncate(get(props.result, 'highlight.body', props.result._source.body)) }} />
            <p>{ 'Recherche effectuée dans la section "consignes" de la discussion' }</p>
          </div>
          : null
        }
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
        this.setState({ show: true });
        simpleQueryString.query = `${simpleQueryString.query}*`;
        modifiedQuery.query.bool.must = [
          { simple_query_string: simpleQueryString }
        ];
      }
      return modifiedQuery;
    });
    const browserLanguage = navigator.language || navigator.userLanguage;
    const locale = GlobalFunctions.getLocale(browserLanguage);
    this.searchkit.translateFunction = (key) => {
      return Translations[locale].search[key];
    };
    this.state = { show: false };
  }

  // <DynamicRangeFilter
  //   field="creation_date"
  //   id="creation_date"
  //   title="Creation date"
  // />
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
            <button
              className="btn"
              onClick={() => {
                this.setState({ show: !this.state.show }, () => {
                  if (this.state.show && !this.searchkit.hasHits()) {
                    this.searchkit.reloadSearch();
                  }
                });
              }}
            >{this.state.show ? this.searchkit.translate('collapse_search') : this.searchkit.translate('expand_search') }</button>
          </TopBar>
          <LayoutBody className={!this.state.show ? 'hidden' : null}>
            <SideBar>
              <MenuFilter
                field="_type"
                id="type"
                title="Types"
              />
            </SideBar>
            <LayoutResults>
              <ActionBar>
                <ActionBarRow>
                  <HitsStats />
                </ActionBarRow>
                <ActionBarRow>
                  <SelectedFilters />
                  <ResetFilters />
                </ActionBarRow>
              </ActionBar>
              <Hits
                hitsPerPage={5}
                highlightFields={queryFields}
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