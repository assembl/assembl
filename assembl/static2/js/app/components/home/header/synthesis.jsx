import React from 'react';
import { I18n } from 'react-redux-i18n';

import BoxWithHyphen from '../../common/boxWithHyphen';
import { getConnectedUserId, getDiscussionSlug } from '../../../utils/globalFunctions';
import { getCurrentView, get, getContextual } from '../../../utils/routeMap';

class Synthesis extends React.Component {
  render() {
    const { error, lastPublishedSynthesis, loading } = this.props.synthesis;
    if (!loading && !error && lastPublishedSynthesis.introduction) {
      const { subject, introduction, publishedInPost, creationDate } = lastPublishedSynthesis;
      const title = I18n.t('synthesis.title');
      const slug = { slug: getDiscussionSlug() };
      const connectedUserId = getConnectedUserId();
      const next = getCurrentView();
      const href = connectedUserId
        ? `${get('oldDebate', slug)}/posts/${encodeURIComponent(publishedInPost)}`
        : `${getContextual('login', slug)}?next=${next}`;

      return (
        <BoxWithHyphen
          additionalContainerClassNames="synthesis-container"
          body={introduction}
          creationDate={creationDate}
          subject={subject}
          title={title}
          href={href}
        />
      );
    }

    return null;
  }
}

export default Synthesis;