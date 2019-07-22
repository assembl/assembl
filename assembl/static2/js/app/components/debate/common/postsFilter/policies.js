// @flow
import { DeletedPublicationStates } from '../../../../constants';

const deletedPublicationStates = Object.keys(DeletedPublicationStates);

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

type PostsComparator = (a: PostWithChildren, b: PostWithChildren) => 1 | 0 | -1; // how to compare groups of posts

const compareOnTopPostCreationDate: PostsComparator = (a: PostWithChildren, b: PostWithChildren) => {
  if (a.creationDate > b.creationDate) {
    return 1;
  } else if (a.creationDate === b.creationDate) {
    return 0;
  }
  return -1;
};

const compareOnLatestCreationDate: PostsComparator = (a: PostWithChildren, b: PostWithChildren) => {
  const firstDate = getLatest(a) || a.creationDate;
  const secondDate = getLatest(b) || b.creationDate;
  if (firstDate > secondDate) {
    return 1;
  } else if (firstDate === secondDate) {
    return 0;
  }
  return -1;
};

export const reverseChronologicalTopPolicy: PostsOrderPolicy = {
  // Recently started threads
  id: 'reverseChronologicalTop',
  postsGroupPolicy: {
    comparator: compareOnTopPostCreationDate,
    reverse: true
  },
  graphqlPostsOrder: 'reverse_chronological',
  labelMsgId: 'debate.thread.postsOrder.reverseChronologicalTop'
};

export const reverseChronologicalLastPolicy: PostsOrderPolicy = {
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

export const chronologicalLastPolicy: PostsOrderPolicy = {
  // Chronological threads
  id: 'chronologicalTop',
  postsGroupPolicy: {
    comparator: compareOnTopPostCreationDate,
    reverse: false
  },
  graphqlPostsOrder: 'chronological',
  labelMsgId: 'debate.thread.postsOrder.chronologicalTop'
};

export const reverseChronologicalFlatPolicy: PostsOrderPolicy = {
  // Newest messages first
  id: 'reverseChronologicalFlat',
  postsGroupPolicy: null,
  graphqlPostsOrder: 'reverse_chronological',
  labelMsgId: 'debate.thread.postsOrder.reverseChronologicalFlat'
};

export const popularityPolicy: PostsOrderPolicy = {
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

export const fullDisplayPolicy: PostsDisplayPolicy = {
  labelMsgId: 'debate.thread.postsDisplay.full',
  id: 'display-full',
  displayMode: 'full'
};

export const summaryDisplayPolicy: PostsDisplayPolicy = {
  labelMsgId: 'debate.thread.postsDisplay.summary',
  id: 'display-summary',
  displayMode: 'summary'
};

export const postsDisplayPolicies: PostsDisplayPolicy[] = [fullDisplayPolicy, summaryDisplayPolicy];

export const defaultDisplayPolicy = fullDisplayPolicy;

export const onlyMyPostFilterPolicy: PostsFilterPolicy = {
  labelMsgId: 'debate.thread.postsFilters.onlyMyPosts',
  id: 'filter-onlyMyPosts',
  filterField: 'onlyMyPosts'
};

export const postsFiltersPolicies: PostsFilterPolicy[] = [onlyMyPostFilterPolicy];

export const defaultPostsFiltersStatus: PostsFiltersStatus = {
  onlyMyPosts: false
};