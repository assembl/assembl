// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  indirectIdeaContentLinks: Array<IdeaContentLinkFragment>
};

const RelatedIdeas = ({ indirectIdeaContentLinks }: Props) => {
  const relatedIdeasTitle = indirectIdeaContentLinks
    ? indirectIdeaContentLinks.map(link => link && link.idea && link.idea.title)
    : [];

  if (relatedIdeasTitle.length === 0) {
    return null;
  }

  return (
    <div className="link-idea">
      <div className="label">
        <Translate value="debate.thread.linkIdea" />
      </div>
      <div className="badges">
        {relatedIdeasTitle.map((title, index) => (
          <span className="badge" key={index}>
            {title}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RelatedIdeas;