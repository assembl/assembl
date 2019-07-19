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
import { withScreenHeight } from '../../../common/screenDimensions';
import { setThreadPostsFilterPolicies } from '../../../../actions/threadFilterActions';
import { defaultDisplayPolicy, defaultOrderPolicy, postsDisplayPolicies, postsOrderPolicies } from './policies';

type Props = {
  postsDisplayPolicy: PostsDisplayPolicy,
  postsOrderPolicy: PostsOrderPolicy,
  screenHeight: number,
  setPostsFilterPolicies: (postsDisplay: PostsDisplayPolicy, postsOrder: PostsOrderPolicy) => void
};

type State = {
  selectedPostsDisplayPolicy: PostsDisplayPolicy,
  selectedPostsOrderPolicy: PostsOrderPolicy,
  sticky: boolean
};

export class DumbPostsFilterMenu extends React.Component<Props, State> {
  componentWillMount(): void {
    const { postsDisplayPolicy, postsOrderPolicy } = this.props;
    this.setState({
      sticky: true,
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

  resetPolicies = () => {
    this.selectPostsDisplayPolicy(defaultDisplayPolicy);
    this.selectPostsOrderPolicy(defaultOrderPolicy);
    this.props.setPostsFilterPolicies(defaultDisplayPolicy, defaultOrderPolicy);
  };

  savePolicies = () => {
    this.props.setPostsFilterPolicies(this.state.selectedPostsDisplayPolicy, this.state.selectedPostsOrderPolicy);
  };

  render() {
    const { selectedPostsDisplayPolicy, selectedPostsOrderPolicy } = this.state;
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
  setPostsFilterPolicies: (postsDisplay: PostsDisplayPolicy, postsOrder: PostsOrderPolicy) =>
    dispatch(setThreadPostsFilterPolicies(postsDisplay, postsOrder))
});

const mapStateToProps = (state) => {
  const { postsOrderPolicy, postsDisplayPolicy } = state.threadFilter;
  return {
    postsOrderPolicy: postsOrderPolicy,
    postsDisplayPolicy: postsDisplayPolicy
  };
};

export default withScreenHeight(connect(mapStateToProps, mapDispatchToProps)(DumbPostsFilterMenu));