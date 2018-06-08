/* eslint-disable no-undef */
// @flow
import * as React from 'react';
import { withRouter } from 'react-router';
import { I18n, Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import throttle from 'lodash/throttle';
import { browserHistory } from '../../router';

import Loader from './loader';
import { displayAlert } from '../../utils/utilityManager';
import { APOLLO_NETWORK_STATUS } from '../../constants';

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
  ListItem: Function | React.ComponentType<*>,
  className?: string,
  location: { hash: string, pathname: string },
  loadPreviousMessage?: string,
  networkStatus: number,
  onEndReachedThreshold: number,
  itemData: Function,
  fetchMore: Function,
  refetch: Function,
  extractItems: Function
};

export class DumbFlatList extends React.Component<FlatListProps> {
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

  handleScroll = throttle(() => {
    if (!this.loading) {
      const { onEndReachedThreshold } = this.props;
      // $FlowFixMe
      const windowHeight = 'innerHeight' in window ? window.innerHeight : document.documentElement.offsetHeight;
      const body = document.body;
      const html = document.documentElement;
      // $FlowFixMe
      const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
      const windowBottom = windowHeight + window.pageYOffset;
      const threshold = docHeight * onEndReachedThreshold;
      if (windowBottom >= threshold) {
        this.onEndReached();
      }
    }
  }, 100);

  onEndReached = throttle(() => {
    // The fetchMore method is used to load new data and add it
    // to the original query we used to populate the list
    const { fetchMore, items, extractItems, networkStatus } = this.props;
    if (!items.pageInfo.hasNextPage) {
      return;
    }
    // If no request is in flight for this query, and no errors happened. Everything is OK.
    if (networkStatus === APOLLO_NETWORK_STATUS.ready) {
      this.loading = true;
      fetchMore({
        variables: { after: items.pageInfo.endCursor || '', fromNode: null },
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
          displayAlert('danger', I18n.t('error.loading'));
          this.loading = false;
        });
    }
  }, 100);

  onRefresh = () => {
    const { refetch } = this.props;
    refetch().catch(() => {
      displayAlert('danger', I18n.t('error.loading'));
    });
  };

  render() {
    const { hash } = this.props.location;
    let id;
    if (hash !== '') {
      id = hash.replace('#', '').split('?')[0];
    }

    const { networkStatus, items, ListItem, itemData, className, loadPreviousMessage } = this.props;
    if (
      items == null ||
      networkStatus === APOLLO_NETWORK_STATUS.loading ||
      networkStatus === APOLLO_NETWORK_STATUS.setVariables
    ) {
      return <Loader color="black" />;
    }
    const entities = items.edges;
    return (
      <div className={className}>
        {id && loadPreviousMessage ? (
          <Button
            className="button-dark button-submit"
            style={{ marginBottom: '20px' }}
            onClick={() => {
              browserHistory.push(this.props.location.pathname);
            }}
          >
            <Translate value={loadPreviousMessage} />
          </Button>
        ) : null}
        {entities && entities.map((item, index) => <ListItem key={item.node.id || index} {...itemData(item)} node={item.node} />)}
        {networkStatus === APOLLO_NETWORK_STATUS.fetchMore && items.pageInfo.hasNextPage && <Loader color="black" />}
      </div>
    );
  }
}

const FlatList = withRouter(DumbFlatList);
export default FlatList;