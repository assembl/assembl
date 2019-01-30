// @flow
import React from 'react';
import { renderRichtext } from '../../../utils/linkify';
// Component imports
import ThematicTabs from '../common/thematicTabs';
// GraphQL imports
import SemanticAnalysisForThematicQuery from '../../../graphql/SemanticAnalysisForThematicQuery.graphql';

export type InstructionsTextProps = {
  /** Title */
  title: string,
  /** Body */
  body: string,
  /** Data for semantic analysis */
  semanticAnalysisForThematicData: SemanticAnalysisForThematicQuery
};

const InstructionsText = ({ title, body, semanticAnalysisForThematicData }: InstructionsTextProps) => {
  const guidelinesContent = (
    <div className="announcement">
      <div className="announcement-title">
        <h3 className="announcement-title-text dark-title-1">{title}</h3>
      </div>
      <div className="announcement-media">{renderRichtext(body)}</div>
    </div>
  );

  return (
    <div fluid className="background-light instructions-text">
      <div className="max-container">
        <div className="content-section">
          <ThematicTabs guidelinesContent={guidelinesContent} semanticAnalysisForThematicData={semanticAnalysisForThematicData} />
        </div>
      </div>
    </div>
  );
};

export default InstructionsText;