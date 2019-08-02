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

const childrenCount = (post: PostWithChildren): number => {
  const children = post.children || [];
  return children.length + children.reduce((acc, child) => acc + (child.children ? 0 : childrenCount(child.children)), 0);
};

const compareOnPopularity: PostsComparator = (a: PostWithChildren, b: PostWithChildren) => {
  const popularityA = a.sentimentCounts.like - a.sentimentCounts.disagree + childrenCount(a);
  const popularityB = b.sentimentCounts.like - b.sentimentCounts.disagree + childrenCount(b);
  if (popularityA === popularityB) {
    return 0;
  } else if (popularityA > popularityB) {
    return 1;
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

export const chronologicalTopPolicy: PostsOrderPolicy = {
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
  postsGroupPolicy: {
    comparator: compareOnPopularity,
    reverse: true
  },
  graphqlPostsOrder: 'popularity',
  labelMsgId: 'debate.thread.postsOrder.popularityFlat'
};

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

export const onlyMyPostFilterPolicy: PostsFilterPolicy = {
  excludedPolicies: ['myPostsAndAnswers'],
  filterField: 'onlyMyPosts',
  id: 'filter-onlyMyPosts',
  labelMsgId: 'debate.thread.postsFilters.onlyMyPosts'
};

export const myPostsAndAnswersFilterPolicy: PostsFilterPolicy = {
  excludedPolicies: ['onlyMyPosts'],
  filterField: 'myPostsAndAnswers',
  labelMsgId: 'debate.thread.postsFilters.myPostsAndAnswers',
  id: 'filter-myPostsAndAnswers'
};

export const defaultOrderPolicy = reverseChronologicalLastPolicy;
export const defaultDisplayPolicy = fullDisplayPolicy;
export const defaultPostsFiltersStatus: PostsFiltersStatus = {
  myPostsAndAnswers: false,
  onlyMyPosts: false
};