// @flow
import * as React from 'react';
import { DropdownButton } from 'react-bootstrap';
import debounce from 'lodash/debounce';
import classNames from 'classnames';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';

import PostsFilterMenuItem from './menuItem';
import PostsFilterButton from './button';
import PostsFilterButtons from './buttons';
import PostsFilterLabelMenuItem from './label';
import { getConnectedUserId } from '../../../../utils/globalFunctions';
import { withScreenHeight } from '../../../common/screenDimensions';
import { setThreadPostsFilterPolicies } from '../../../../actions/threadFilterActions';
import {
  defaultDisplayPolicy,
  defaultOrderPolicy,
  defaultPostsFiltersStatus,
  postsDisplayPolicies,
  postsFiltersPolicies,
  postsOrderPolicies
} from './policies';

type Props = {
  postsDisplayPolicy: PostsDisplayPolicy,
  postsFiltersStatus: PostsFiltersStatus,
  postsOrderPolicy: PostsOrderPolicy,
  screenHeight: number,
  setPostsFilterPolicies: (
    postsDisplay: PostsDisplayPolicy,
    postsOrder: PostsOrderPolicy,
    postsFiltersStatus: PostsFiltersStatus
  ) => void
};

type State = {
  selectedPostsDisplayPolicy: PostsDisplayPolicy,
  selectedPostsFiltersStatus: PostsFiltersStatus,
  selectedPostsOrderPolicy: PostsOrderPolicy,
  sticky: boolean
};

export class DumbPostsFilterMenu extends React.Component<Props, State> {
  componentWillMount(): void {
    const { postsDisplayPolicy, postsOrderPolicy, postsFiltersStatus } = this.props;
    this.setState({
      sticky: true,
      selectedPostsFiltersStatus: { ...postsFiltersStatus },
      selectedPostsDisplayPolicy: postsDisplayPolicy,
      selectedPostsOrderPolicy: postsOrderPolicy
    });
  }

  componentDidMount() {
    window.addEventListener('scroll', this.setButtonPosition);
  }

  componentWillUnmount = () => {
    window.removeEventListener('scroll', this.setButtonPosition);
  };

  setButtonPosition = debounce(() => {
    const { screenHeight } = this.props;
    if (window.pageYOffset > screenHeight - 60) {
      // Show the button when we scrolled minimum the height of the window.
      this.setState({ sticky: true });
    } else {
      this.setState({ sticky: false });
    }
  }, 100);

  selectPostsDisplayPolicy = (postsDisplayPolicy: any) => {
    // FIXME PostsDisplayPolicy
    this.setState({ selectedPostsDisplayPolicy: postsDisplayPolicy });
  };

  selectPostsOrderPolicy = (postsOrderPolicy: any) => {
    // FIXME PostsOrderPolicy
    this.setState({ selectedPostsOrderPolicy: postsOrderPolicy });
  };

  selectPostsFilter = (postsFilterPolicy: any, selected?: boolean) => {
    // FIXME PostsFilterPolicy
    const selectedPostsFiltersStatus = { ...this.state.selectedPostsFiltersStatus };
    selectedPostsFiltersStatus[postsFilterPolicy.filterField] = !!selected;
    if (selected) {
      // unselect excluded policies
      postsFilterPolicy.excludedPolicies.forEach((policyId: string) => {
        selectedPostsFiltersStatus[policyId] = false;
      });
    }
    this.setState({ selectedPostsFiltersStatus: selectedPostsFiltersStatus });
  };

  resetPolicies = () => {
    this.selectPostsDisplayPolicy(defaultDisplayPolicy);
    this.selectPostsOrderPolicy(defaultOrderPolicy);
    this.setState({ selectedPostsFiltersStatus: defaultPostsFiltersStatus });
    this.props.setPostsFilterPolicies(defaultDisplayPolicy, defaultOrderPolicy, defaultPostsFiltersStatus);
  };

  savePolicies = () => {
    this.props.setPostsFilterPolicies(
      this.state.selectedPostsDisplayPolicy,
      this.state.selectedPostsOrderPolicy,
      this.state.selectedPostsFiltersStatus
    );
  };

  render() {
    const { selectedPostsDisplayPolicy, selectedPostsFiltersStatus, selectedPostsOrderPolicy, sticky } = this.state;
    const userIsConnected: boolean = !!getConnectedUserId();
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
              selected={item.id === selectedPostsOrderPolicy.id}
              inputType="radio"
              inputName="postsOrder"
              onSelectItem={this.selectPostsOrderPolicy}
              eventKey={item.id}
            />
          ))}
          <PostsFilterLabelMenuItem labelMsgId="debate.thread.overviewPosts" />

          {postsDisplayPolicies.map(item => (
            <PostsFilterMenuItem
              key={item.id}
              item={item}
              selected={item.id === selectedPostsDisplayPolicy.id}
              inputType="radio"
              inputName="postsDisplay"
              onSelectItem={this.selectPostsDisplayPolicy}
              eventKey={item.id}
            />
          ))}

          {userIsConnected && (
            <React.Fragment>
              <PostsFilterLabelMenuItem labelMsgId="debate.thread.filterPosts" />
              {postsFiltersPolicies.map(item => (
                <PostsFilterMenuItem
                  key={item.id}
                  item={item}
                  selected={selectedPostsFiltersStatus[item.filterField]}
                  inputType="checkbox"
                  inputName={item.filterField}
                  onSelectItem={this.selectPostsFilter}
                  eventKey={item.id}
                />
              ))}
            </React.Fragment>
          )}
          <PostsFilterButtons>
            <PostsFilterButton
              id="postsFilter-button-reset"
              onClick={this.resetPolicies}
              i18nTitle="debate.thread.postsOrder.cleanFilter"
              bsStyle="default"
            />
            <PostsFilterButton
              id="postsFilter-button-save"
              style={{ textAlign: 'right', float: 'right' }}
              onClick={this.savePolicies}
              i18nTitle="ok"
              bsStyle="success"
            />
          </PostsFilterButtons>
        </DropdownButton>
      </div>
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

export default withScreenHeight(connect(mapStateToProps, mapDispatchToProps)(DumbPostsFilterMenu));