// @flow
import * as React from 'react';
import { DropdownButton } from 'react-bootstrap';
import { connect } from 'react-redux';
import { DeletedPublicationStates } from '../../../constants';
import PostsFilterMenuItem from './postsFilterMenuItem';
import { setThreadPostsOrder } from '../../../actions/threadFilterActions';

const deletedPublicationStates = Object.keys(DeletedPublicationStates);

type postsComparator = (a: PostWithChildren, b: PostWithChildren) => 1 | 0 | -1; // how to compare groups of posts

/*
 * From a post, get the latest creationDate of live descendants and self
 */
const getLatest: (post: PostWithChildren) => string | null = (post) => {
  let maxDate = post.creationDate;
  if (post.children.length === 0) {
    if (deletedPublicationStates.indexOf(post.publicationState) > -1) {
      return null;
    }
    return maxDate;
  }
  post.children.forEach((p) => {
    const date = getLatest(p);
    if (date && date > maxDate) {
      maxDate = date;
    }
  });
  return maxDate;
};

const compareOnTopPostCreationDate: postsComparator = (a: PostWithChildren, b: PostWithChildren) => {
  if (a.creationDate > b.creationDate) {
    return 1;
  } else if (a.creationDate === b.creationDate) {
    return 0;
  }
  return -1;
};

const compareOnLatestCreationDate: postsComparator = (a: PostWithChildren, b: PostWithChildren) => {
  const firstDate = getLatest(a) || a.creationDate;
  const secondDate = getLatest(b) || b.creationDate;
  if (firstDate > secondDate) {
    return 1;
  } else if (firstDate === secondDate) {
    return 0;
  }
  return -1;
};

export const reverseChronologicalTopPolicy = {
  // Recently started threads
  id: 'reverseChronologicalTop',
  postsGroupPolicy: {
    comparator: compareOnTopPostCreationDate,
    reverse: true
  },
  graphqlPostsOrder: 'reverse_chronological',
  labelMsgId: 'debate.thread.postsOrder.reverseChronologicalTop'
};

export const reverseChronologicalLastPolicy = {
  // Recently active threads
  id: 'reverseChronologicalLast',
  postsGroupPolicy: {
    comparator: compareOnLatestCreationDate,
    reverse: true
  },
  reversePosts: true,
  graphqlPostsOrder: 'reverse_chronological',
  labelMsgId: 'debate.thread.postsOrder.reverseChronologicalLast'
};

export const chronologicalLastPolicy = {
  // Chronological threads
  id: 'chronologicalTop',
  postsGroupPolicy: {
    comparator: compareOnTopPostCreationDate,
    reverse: false
  },
  graphqlPostsOrder: 'chronological',
  labelMsgId: 'debate.thread.postsOrder.chronologicalTop'
};

export const reverseChronologicalFlatPolicy = {
  // Newest messages first
  id: 'reverseChronologicalFlat',
  postsGroupPolicy: null,
  graphqlPostsOrder: 'reverse_chronological',
  labelMsgId: 'debate.thread.postsOrder.reverseChronologicalFlat'
};

export const popularityPolicy = {
  // Popular messages first
  id: 'popularityFlat',
  postsGroupPolicy: null,
  graphqlPostsOrder: 'popularity',
  labelMsgId: 'debate.thread.postsOrder.popularityFlat'
};

export const postsOrderPolicies: PostsOrderPolicy[] = [
  reverseChronologicalTopPolicy,
  reverseChronologicalLastPolicy,
  chronologicalLastPolicy,
  reverseChronologicalFlatPolicy,
  popularityPolicy
];

export const defaultOrderPolicy = reverseChronologicalLastPolicy;

type Props = {
  setPostsOrderPolicy: Function,
  postsOrderPolicy: PostsOrderPolicy
};

class DumbPostsFilterMenu extends React.Component<Props> {
  render() {
    const { postsOrderPolicy, setPostsOrderPolicy } = this.props;
    return (
      <DropdownButton
        drop="up"
        title={<img height={24} width={24} src="/static2/img/icons/black/filter.svg" alt="user pic" />}
        id="postsFilter-dropdown"
      >
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
      </DropdownButton>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  setPostsOrderPolicy: (postsOrder: PostsOrderPolicy) => dispatch(setThreadPostsOrder(postsOrder))
});
const mapStateToProps = (state) => {
  const { postsOrderPolicy } = state.threadFilter;
  return {
    postsOrderPolicy: postsOrderPolicy
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DumbPostsFilterMenu);