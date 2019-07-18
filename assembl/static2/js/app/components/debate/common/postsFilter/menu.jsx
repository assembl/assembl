// @flow
import * as React from 'react';
import { DropdownButton } from 'react-bootstrap';
import debounce from 'lodash/debounce';
import classNames from 'classnames';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';

import PostsFilterMenuItem from './menuItem';
import PostsFilterButton from './button';
import PostsFilterLabelMenuItem from './label';
import { withScreenHeight } from '../../../common/screenDimensions';
import {
  resetThreadFilterDefaults,
  setThreadPostsDisplayPolicy,
  setThreadPostsOrder
} from '../../../../actions/threadFilterActions';
import { postsDisplayPolicies, postsOrderPolicies } from './policies';

type Props = {
  postsDisplayPolicy: PostsDisplayPolicy,
  postsOrderPolicy: PostsOrderPolicy,
  resetFilter: () => void,
  screenHeight: number,
  setPostsDisplayPolicy: any, // FIXME PostsDisplayPolicy => void,
  setPostsOrderPolicy: any // FIXME PostsOrderPolicy => void
};

type State = {
  sticky: boolean
};

class DumbPostsFilterMenu extends React.Component<Props, State> {
  state = { sticky: false };

  componentDidMount() {
    window.addEventListener('scroll', this.setButtonPosition);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.setButtonPosition);
  }

  setButtonPosition = debounce(() => {
    const { screenHeight } = this.props;
    if (window.pageYOffset > screenHeight - 60) {
      // Show the button when we scrolled minimum the height of the window.
      this.setState({ sticky: true });
    } else {
      this.setState({ sticky: false });
    }
  }, 100);

  render() {
    const { postsDisplayPolicy, postsOrderPolicy, resetFilter, setPostsDisplayPolicy, setPostsOrderPolicy } = this.props;
    const { sticky } = this.state;

    return (
      <div className={classNames(['posts-filter-button', sticky ? 'sticky' : null])}>
        <DropdownButton
          pullRight
          title={
            <img
              height={24}
              width={24}
              src="/static2/img/icons/black/filter.svg"
              alt={I18n.t('debate.thread.sortFilterPosts')}
              title={I18n.t('debate.thread.sortFilterPosts')}
            />
          }
          id="postsFilter-dropdown"
        >
          <PostsFilterLabelMenuItem labelMsgId="debate.thread.sortPosts" />

          {postsOrderPolicies.map(item => (
            <PostsFilterMenuItem
              key={item.id}
              item={item}
              selected={item.id === postsOrderPolicy.id}
              inputType="radio"
              inputName="postsOrder"
              onSelectItem={setPostsOrderPolicy}
              eventKey={item.id}
            />
          ))}
          <PostsFilterLabelMenuItem labelMsgId="debate.thread.overviewPosts" />

          {postsDisplayPolicies.map(item => (
            <PostsFilterMenuItem
              key={item.id}
              item={item}
              selected={item.id === postsDisplayPolicy.id}
              inputType="radio"
              inputName="postsDisplay"
              onSelectItem={setPostsDisplayPolicy}
              eventKey={item.id}
            />
          ))}

          <PostsFilterButton
            className="pull-right"
            onClick={resetFilter}
            i18nTitle="debate.thread.postsOrder.cleanFilter"
            bsStyle="primary"
          />
        </DropdownButton>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  resetFilter: () => dispatch(resetThreadFilterDefaults()),
  setPostsOrderPolicy: (postsOrder: PostsOrderPolicy) => dispatch(setThreadPostsOrder(postsOrder)),
  setPostsDisplayPolicy: (postsDisplayPolicy: PostsDisplayPolicy) => dispatch(setThreadPostsDisplayPolicy(postsDisplayPolicy))
});
const mapStateToProps = (state) => {
  const { postsOrderPolicy, postsDisplayPolicy } = state.threadFilter;
  return {
    postsOrderPolicy: postsOrderPolicy,
    postsDisplayPolicy: postsDisplayPolicy
  };
};

export default withScreenHeight(connect(mapStateToProps, mapDispatchToProps)(DumbPostsFilterMenu));