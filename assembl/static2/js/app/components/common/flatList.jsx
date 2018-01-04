/* eslint-disable no-undef */
// @flow
import React from 'react';

import Loader from './loader';
import { displayAlert } from '../../utils/utilityManager';

type ItemNode = {
  node: Object
};

type FlatListProps = {
  items: {
    pageInfo: {
      endCursor: string,
      hasNextPage: boolean
    },
    edges: Array<ItemNode>
  },
  ListItem: Function | ReactClass<*>,
  className: string,
  networkStatus: number,
  onEndReachedThreshold: number,
  itemData: Function,
  fetchMore: Function,
  refetch: Function,
  extractItems: Function
};

class FlatList extends React.Component<*, FlatListProps, void> {
  props: FlatListProps;

  loading: boolean;

  static defaultProps = {
    onEndReachedThreshold: 0.8,
    itemData: () => {}
  };

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    const { onEndReachedThreshold } = this.props;
    // $FlowFixMe
    const windowHeight = 'innerHeight' in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    // $FlowFixMe
    const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    const windowBottom = windowHeight + window.pageYOffset;
    const threshold = docHeight * onEndReachedThreshold;
    if (windowBottom >= threshold && !this.loading) {
      this.onEndReached();
    }
  };

  onEndReached = () => {
    // The fetchMore method is used to load new data and add it
    // to the original query we used to populate the list
    const { fetchMore, items, extractItems, networkStatus } = this.props;
    // If no request is in flight for this query, and no errors happened. Everything is OK.
    if (networkStatus === 7) {
      this.loading = true;
      fetchMore({
        variables: { after: items.pageInfo.endCursor || '' },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          // Don't do anything if there weren't any new items
          const previousResultEntities = extractItems(previousResult);
          if (!fetchMoreResult || !previousResultEntities.pageInfo.hasNextPage) {
            return previousResult;
          }
          const fetchMoreResultEntities = extractItems(fetchMoreResult);
          fetchMoreResultEntities.edges = previousResultEntities.edges.concat(fetchMoreResultEntities.edges);
          return fetchMoreResult;
        }
      })
        .then(() => {
          this.loading = false;
        })
        .catch(() => {
          displayAlert('danger', 'An error occured, please reload the page');
          this.loading = false;
        });
    }
  };

  onRefresh = () => {
    const { refetch } = this.props;
    refetch().catch(() => {
      displayAlert('danger', 'An error occured, please reload the page');
    });
  };

  render() {
    const { networkStatus, items, ListItem, itemData, className } = this.props;
    if (items == null || networkStatus === 1 || networkStatus === 2) {
      return <Loader color="black" />;
    }
    const entities = items.edges;
    return (
      <div className={className}>
        {entities &&
          entities.length > 0 &&
          entities.map((item, index) => <ListItem key={item.node.id || index} {...itemData(item)} node={item.node} />)}
        {networkStatus === 3 && items.pageInfo.hasNextPage && <Loader color="black" />}
      </div>
    );
  }
}

export default FlatList;