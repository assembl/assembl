// @flow
import React from 'react';

import Question, { type Props } from './question';
import { connectedUserIsAdmin } from '../utils/permissions';
import { get, goTo } from '../utils/routeMap';

class QuestionModeratePosts extends React.Component<Props> {
  componentDidMount() {
    if (!connectedUserIsAdmin()) {
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