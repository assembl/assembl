import React from 'react';
import { get } from '../utils/routeMap';
import { getDiscussionSlug } from '../utils/globalFunctions';

class TokenVote extends React.Component {
  render() {
    const routeArgs = { slug: getDiscussionSlug() };
    window.location = get('oldVote', routeArgs);
    return <div />;
  }
}

export default TokenVote;