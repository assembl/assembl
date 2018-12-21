// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  relatedIdeasTitles: Array<String>
};

const RelatedIdeas = ({ relatedIdeasTitles }: Props) => (
  <div className="link-idea">
    <div className="label">
      <Translate value="debate.thread.linkIdea" />
    </div>
    <div className="badges">
      {relatedIdeasTitles.map((title, index) => (
        <span className="badge" key={index}>
          {title}
        </span>
      ))}
    </div>
  </div>
);

export default RelatedIdeas;