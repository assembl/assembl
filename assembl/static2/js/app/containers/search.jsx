/* eslint no-underscore-dangle: 0, react/no-danger: 0 */
import React from 'react';

import {
  MenuFilter,
  // DynamicRangeFilter,
  SearchBox,
  Hits,
  HitsStats,
  PageSizeSelector,
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
import { get } from 'lodash';

import 'searchkit/theming/theme.scss';
import '../../../css/views/search.scss';

import GlobalFunctions from '../utils/globalFunctions';

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

// TODO get the right subject highlight, fr, en in priority, then fallback to und(efined). Same for body obviously.
// TODO pagination component doesn't seem to work
// TODO translations fr/en
// TODO issue with sidebar range filter, it sometime disappears
// (when there is only 1 result), and the selected range is not kept (maybe because of the date field...)

const HitItem = (props) => {
  return (
    <div className={props.bemBlocks.item().mix(props.bemBlocks.container('item'))}>
      <div className={props.bemBlocks.item('title')}>
        <a
          href={props.result._source.url}
          dangerouslySetInnerHTML={{ __html: get(props.result, 'highlight.subject_und', props.result._source.subject_und) }}
        />
        <p dangerouslySetInnerHTML={{ __html: truncate(get(props.result, 'highlight.body_und', props.result._source.body_und)) }} />
      </div>
    </div>
  );
};

const queryFields = [
  'subject_und',
  'subject_fr',
  'subject_en',
  'body_und',
  'body_fr',
  'body_en'
];

export default class Search extends React.Component {

  constructor() {
    super();
    const discussionId = GlobalFunctions.getDiscussionId();
    const host = '/';
    this.searchkit = new SearchkitManager(host);
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
        simpleQueryString.query = `${simpleQueryString.query}*`;
        modifiedQuery.query.bool.must = [
          { simple_query_string: simpleQueryString }
        ];
      }
      return modifiedQuery;
    });
    // this.searchkit.translateFunction = (key) => {
    //   return { 'pagination.next': 'Next Page', 'pagination.previous': 'Previous Page' }[key];
    // };
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
              queryFields={queryFields}
            />
          </TopBar>
          <LayoutBody>
            <SideBar>
              <MenuFilter
                field="type"
                id="type"
                title="Types"
              />
            </SideBar>
            <LayoutResults>
              <ActionBar>
                <ActionBarRow>
                  <HitsStats
                    translations={{ 'hitstats.results_found': '{hitCount} results found' }}
                  />
                </ActionBarRow>
                <ActionBarRow>
                  Affichage par : <PageSizeSelector options={[20, 50, 100]} />
                  <SelectedFilters />
                  <ResetFilters />
                </ActionBarRow>
              </ActionBar>
              <Hits
                hitsPerPage={20}
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