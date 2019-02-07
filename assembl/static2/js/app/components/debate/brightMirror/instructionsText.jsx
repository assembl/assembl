// @flow
import React from 'react';
import { renderRichtext } from '../../../utils/linkify';
// Component imports
import ThematicTabs from '../common/thematicTabs';
import Title from '../../common/title/title';
import { isMobile } from '../../../utils/globalFunctions';
// GraphQL imports
import SemanticAnalysisForThematicQuery from '../../../graphql/SemanticAnalysisForThematicQuery.graphql';

export type InstructionsTextProps = {
  /** Title */
  title: string,
  /** Body */
  body: string,
  summary: ?string,
  /** Data for semantic analysis */
  semanticAnalysisForThematicData: SemanticAnalysisForThematicQuery
};

const InstructionsText = ({ title, body, summary, semanticAnalysisForThematicData }: InstructionsTextProps) => {
  const guidelinesContent = (
    <div className="announcement">
      <div className="announcement-title">
        <Title level={1}>{title}</Title>
      </div>
      <div className="announcement-media announcement-text-only">{renderRichtext(body)}</div>
    </div>
  );

  return (
    <div className="background-light instructions-text">
      <div className="max-container">
        <div className="content-section section-margin-top">
          <ThematicTabs
            guidelinesContent={guidelinesContent}
            summary={summary}
            semanticAnalysisForThematicData={semanticAnalysisForThematicData}
            isMobile={!!isMobile.any()}
          />
        </div>
      </div>
    </div>
  );
};

export default InstructionsText;