// @flow
import * as React from 'react';
import { DropdownButton } from 'react-bootstrap';
import debounce from 'lodash/debounce';
import classNames from 'classnames';
import { I18n } from 'react-redux-i18n';

import PostsFilterMenuItem from './menuItem';
import PostsFilterButton from './button';
import PostsFilterButtons from './buttons';
import PostsFilterLabelMenuItem from './label';
import { getConnectedUserId } from '../../../../utils/globalFunctions';
import { withScreenHeight } from '../../../common/screenDimensions';
import {
  defaultDisplayPolicy,
  defaultOrderPolicy,
  defaultPostsFiltersStatus
} from './policies';
import { ICO_FILTER } from '../../../../constants';

type Props = {
  defaultDisplayPolicy: PostsDisplayPolicy,
  defaultOrderPolicy: PostsOrderPolicy,
  defaultPostsFiltersStatus: PostsFiltersStatus,
  postsDisplayPolicies: PostsDisplayPolicy[],
  postsFiltersPolicies: PostsFilterPolicy[],
  postsOrderPolicies: PostsOrderPolicy[],
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
  open: boolean,
  selectedPostsDisplayPolicy: PostsDisplayPolicy,
  selectedPostsFiltersStatus: PostsFiltersStatus,
  selectedPostsOrderPolicy: PostsOrderPolicy,
  sticky: boolean
};

/*
 * Generic post filter component. Specific filter components are in subfolders survey/, thread/, etc.
 * */
export class DumbPostsFilterMenu extends React.Component<Props, State> {
  static defaultProps = {
    defaultOrderPolicy: defaultOrderPolicy,
    defaultDisplayPolicy: defaultDisplayPolicy,
    defaultPostsFiltersStatus: defaultPostsFiltersStatus
  };

  componentWillMount(): void {
    const { postsDisplayPolicy, postsOrderPolicy, postsFiltersStatus } = this.props;
    this.setState({
      open: false,
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

  onToggle = () => {
    const { open } = this.state;
    this.setState({ open: !open });
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
    // FIXME use PostsDisplayPolicy type
    this.setState({ selectedPostsDisplayPolicy: postsDisplayPolicy });
  };

  selectPostsOrderPolicy = (postsOrderPolicy: any) => {
    // FIXME use PostsOrderPolicy type
    this.setState({ selectedPostsOrderPolicy: postsOrderPolicy });
  };

  selectPostsFilter = (postsFilterPolicy: any, selected?: boolean) => {
    // FIXME use PostsFilterPolicy type
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
    this.setState({ selectedPostsFiltersStatus: this.props.defaultPostsFiltersStatus });
    this.props.setPostsFilterPolicies(
      this.props.defaultDisplayPolicy,
      this.props.defaultOrderPolicy,
      this.props.defaultPostsFiltersStatus
    );
    this.setState({ open: false });
  };

  savePolicies = () => {
    this.props.setPostsFilterPolicies(
      this.state.selectedPostsDisplayPolicy,
      this.state.selectedPostsOrderPolicy,
      this.state.selectedPostsFiltersStatus
    );
    this.setState({ open: false });
  };

  render() {
    const { selectedPostsDisplayPolicy, selectedPostsFiltersStatus, selectedPostsOrderPolicy, sticky } = this.state;
    const { postsDisplayPolicies, postsOrderPolicies, postsFiltersPolicies } = this.props;
    const userIsConnected: boolean = !!getConnectedUserId();
    return (
      <div className={classNames(['posts-filter-button', sticky ? 'sticky' : null])}>
        <DropdownButton
          pullRight
          open={this.state.open}
          onToggle={this.onToggle}
          title={
            <img
              height={24}
              width={24}
              src={ICO_FILTER}
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
              className="button-cancel button-dark"
              i18nTitle="debate.thread.postsOrder.cleanFilter"
              bsStyle="default"
            />
            <PostsFilterButton
              id="postsFilter-button-save"
              style={{ textAlign: 'right', float: 'right' }}
              className="button-submit button-dark"
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

export default withScreenHeight(DumbPostsFilterMenu);