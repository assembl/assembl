// @flow
import { browserHistory } from '../../../router';
import { get } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';

export const goToModulesAdmin = () => {
  browserHistory.push(`${get('administration', { slug: getDiscussionSlug(), id: 'landingPage' }, { section: '2' })}`);
};