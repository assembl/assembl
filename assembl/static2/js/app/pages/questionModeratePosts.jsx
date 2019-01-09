// @flow
import React from 'react';

import Question, { type Props } from './question';
import { connectedUserIsModerator } from '../utils/permissions';
import { get, goTo } from '../utils/routeMap';

class QuestionModeratePosts extends React.Component<Props> {
  componentDidMount() {
    if (!connectedUserIsModerator()) {
      const { params: { slug } } = this.props;
      goTo(
        get('unauthorizedAdministration', {
          slug: slug
        })
      );
    }
  }

  render() {
    return <Question {...this.props} isModerating />;
  }
}

export default QuestionModeratePosts;