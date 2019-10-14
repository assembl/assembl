// @flow
import {
  chronologicalTopPolicy,
  fullDisplayPolicy,
  hashtagsFilterPolicy,
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
  chronologicalTopPolicy,
  reverseChronologicalFlatPolicy,
  popularityPolicy
];

export const postsDisplayPolicies: PostsDisplayPolicy[] = [fullDisplayPolicy, summaryDisplayPolicy];

export const postsFiltersPolicies: PostsFilterPolicy[] = [
  onlyMyPostFilterPolicy,
  myPostsAndAnswersFilterPolicy,
  hashtagsFilterPolicy
];