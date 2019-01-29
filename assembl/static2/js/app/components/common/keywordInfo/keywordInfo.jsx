// @flow
import React from 'react';
// Helpers imports
import { I18n } from 'react-redux-i18n';
// Component import
import Description from '../description/description';
// Type imports
import type { Keyword } from '../../../integration/semanticAnalysis/dataType';

export type Props = {
  /** Keyword information */
  keyword: Keyword
};

const KeywordInfo = ({ keyword }: Props) => {
  // Translation keys
  const ocurrenceKey = 'debate.semanticAnalysis.occurence';
  const relevanceKey = 'debate.semanticAnalysis.relevance';

  // Title contents
  const occurenceTitle: string = I18n.t(ocurrenceKey);
  const relevanceTitle: string = I18n.t(relevanceKey);

  return (
    <Description className="keyword-info">
      <h3>{keyword.text}</h3>
      <p className="info">{`${occurenceTitle} : ${keyword.count}`}</p>
      <p className="info">{`${relevanceTitle} : ${keyword.relevance}`}</p>
    </Description>
  );
};

export default KeywordInfo;