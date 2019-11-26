// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { postsDisplayPolicies, postsFiltersPolicies, postsOrderPolicies } from './policies';

import FiltersDropdown from '../filtersDropdown';
import { setThreadPostsFilterPolicies } from '../../../../../actions/threadFilterActions';

type Props = {
  postsDisplayPolicy: PostsDisplayPolicy,
  postsFiltersStatus: PostsFiltersStatus,
  postsOrderPolicy: PostsOrderPolicy,
  screenHeight: number,
  setPostsFilterPolicies: (
    postsDisplay: PostsDisplayPolicy,
    postsOrder: PostsOrderPolicy,
    postsFiltersStatus: PostsFiltersStatus
  ) => void,
  stickyOffset: number
};

type State = {
  selectedPostsDisplayPolicy: PostsDisplayPolicy,
  selectedPostsFiltersStatus: PostsFiltersStatus,
  selectedPostsOrderPolicy: PostsOrderPolicy,
  sticky: boolean
};

export class ThreadFiltersDropdown extends React.Component<Props, State> {
  render() {
    return (
      <FiltersDropdown
        postsDisplayPolicies={postsDisplayPolicies}
        postsFiltersPolicies={postsFiltersPolicies}
        postsOrderPolicies={postsOrderPolicies}
        {...this.props}
      />
    );
  }
}

const mapDispatchToProps = dispatch => ({
  setPostsFilterPolicies: (
    postsDisplay: PostsDisplayPolicy,
    postsOrder: PostsOrderPolicy,
    postsFiltersStatus: PostsFiltersStatus
  ) => dispatch(setThreadPostsFilterPolicies(postsDisplay, postsOrder, postsFiltersStatus))
});

const mapStateToProps = (state) => {
  const { postsOrderPolicy, postsDisplayPolicy, postsFiltersStatus } = state.threadFilter;
  return {
    postsOrderPolicy: postsOrderPolicy,
    postsDisplayPolicy: postsDisplayPolicy,
    postsFiltersStatus: postsFiltersStatus
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ThreadFiltersDropdown);