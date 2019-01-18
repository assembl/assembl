// @flow
import React from 'react';

// Helpers imports
import { I18n } from 'react-redux-i18n';

// Components import
import Description from '../description/description';

export type Props = {
  /** Optional color */
  color: string,
  /** Keyword information */
  keyword: any
};

const KeywordInfo = ({ color, keyword }: Props) => {
  // Translation keys
  const ocurrenceKey = 'debate.semanticAnalysis.occurence';
  const relevanceKey = 'debate.semanticAnalysis.relevance';

  // Title contents
  const occurenceTitle = I18n.t(ocurrenceKey);
  const relevanceTitle = I18n.t(relevanceKey);

  const colorStyle = {
    color: color // eslint-line-disable comma-dangle
  };
  return (
    <Description>
      <h3 style={colorStyle}>{keyword.text}</h3>
      <p className="info">{`${occurenceTitle} : ${keyword.count}`}</p>
      <p className="info">{`${relevanceTitle} : ${keyword.relevance}`}</p>
    </Description>
  );
};

KeywordInfo.defaultProps = {
  color: '#000'
};

export default KeywordInfo;