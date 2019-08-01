// @flow
import {
  chronologicalLastPolicy,
  fullDisplayPolicy,
  myPostsAndAnswersFilterPolicy,
  onlyMyPostFilterPolicy,
  popularityPolicy,
  reverseChronologicalFlatPolicy,
  reverseChronologicalLastPolicy,
  reverseChronologicalTopPolicy,
  summaryDisplayPolicy
} from '../policies';

export const postsOrderPolicies: PostsOrderPolicy[] = [
  reverseChronologicalTopPolicy,
  reverseChronologicalLastPolicy,
  chronologicalLastPolicy,
  reverseChronologicalFlatPolicy,
  popularityPolicy
];

export const postsDisplayPolicies: PostsDisplayPolicy[] = [fullDisplayPolicy, summaryDisplayPolicy];

export const postsFiltersPolicies: PostsFilterPolicy[] = [onlyMyPostFilterPolicy, myPostsAndAnswersFilterPolicy];