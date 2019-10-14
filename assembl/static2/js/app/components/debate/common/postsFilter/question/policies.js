// @flow
import {
  chronologicalTopPolicy,
  fullDisplayPolicy,
  hashtagsFilterPolicy,
  onlyMyPostFilterPolicy,
  popularityPolicy,
  reverseChronologicalLastPolicy,
  summaryDisplayPolicy
} from '../policies';

export const postsOrderPolicies: PostsOrderPolicy[] = [
  // $FlowFixMe flow can't detect that destructured object has all right properties...
  { ...reverseChronologicalLastPolicy, labelMsgId: 'debate.survey.postsOrder.reverseChronologicalLast' },
  // $FlowFixMe
  { ...chronologicalTopPolicy, labelMsgId: 'debate.survey.postsOrder.chronologicalTop' },
  // $FlowFixMe
  { ...popularityPolicy, labelMsgId: 'debate.survey.postsOrder.popularityFlat' }
];
export const postsDisplayPolicies: PostsDisplayPolicy[] = [fullDisplayPolicy, summaryDisplayPolicy];
export const postsFiltersPolicies: PostsFilterPolicy[] = [onlyMyPostFilterPolicy, hashtagsFilterPolicy];