// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Col, Grid, Tabs, Tab } from 'react-bootstrap';
import { renderRichtext } from '../../../utils/linkify';
// Component imports
import { SemanticAnalysis } from '../../../pages/semanticAnalysis/semanticAnalysis';
import { ANNOUNCEMENT_TAB_ITEM_ID } from '../../../constants';
// GraphQL imports
import SemanticAnalysisForThematicQuery from '../../../graphql/SemanticAnalysisForThematicQuery.graphql';

export type InstructionsTextProps = {
  title: string,
  body: string,
  semanticAnalysisForThematicData: SemanticAnalysisForThematicQuery,
  firstColor: string,
  secondColor: string
};

const InstructionsText = ({ title, body, semanticAnalysisForThematicData, firstColor, secondColor }: InstructionsTextProps) => {
  const { topKeywords } = semanticAnalysisForThematicData;
  const topKeywordsCount = topKeywords.length;

  // Translation keys
  const guidelinesTitleKey = 'debate.thread.guidelines';
  // Uncomment the line below when adding the summary
  // const summaryTitleKey = 'debate.thread.summary';
  const semanticAnalysisLongTitleKey = 'debate.semanticAnalysis.long';
  const semanticAnalysisShortTitleKey = 'debate.semanticAnalysis.short';

  // Title contents
  const guidelinesTabTitle = I18n.t(guidelinesTitleKey);
  // Uncomment the line below when adding the summary
  // const summaryTabTitle = I18n.t(summaryTitleKey);
  const semanticAnalysisTabLongTitle = I18n.t(semanticAnalysisLongTitleKey);
  const semanticAnalysisTabShortTitle = I18n.t(semanticAnalysisShortTitleKey);
  // Since 'semantic analysis' is a long composed word, we only display 'analysis' on small devices
  const semanticAnalysisTabTitle = (
    <React.Fragment>
      {semanticAnalysisTabShortTitle}
      <span className="md-only">{semanticAnalysisTabLongTitle}</span>
    </React.Fragment>
  );
  const instructionContent = (
    <div className="announcement">
      <div className="announcement-title">
        <div className="title-hyphen">&nbsp;</div>
        <h3 className="announcement-title-text dark-title-1">{title}</h3>
      </div>
      <Col xs={12} md={8} className="announcement-media col-md-push-2">
        {renderRichtext(body)}
      </Col>
    </div>
  );

  const guidelinesTabAndContent = (
    <Tab eventKey={ANNOUNCEMENT_TAB_ITEM_ID.GUIDELINES} title={guidelinesTabTitle}>
      {instructionContent}
    </Tab>
  );

  // Uncomment those line below when adding the summary
  // const summaryTabAndContent = (
  //   <Tab eventKey={ANNOUNCEMENT_TAB_ITEM_ID.SUMMARY} title={summaryTabTitle}>
  //     {/** Summary Component and Content */}
  //   </Tab>
  // );

  const semanticAnalysisTabAndContent = (
    <Tab eventKey={ANNOUNCEMENT_TAB_ITEM_ID.SEMANTIC_ANALYSIS} title={semanticAnalysisTabTitle}>
      <div id="semantic-analysis-thematic" className="semantic-analysis">
        <SemanticAnalysis
          semanticAnalysisData={semanticAnalysisForThematicData}
          firstColor={firstColor}
          secondColor={secondColor}
        />
      </div>
    </Tab>
  );

  return (
    <Grid fluid className="background-light instructions-text">
      <div className="max-container">
        <div className="content-section">
          <Tabs
            id="announcement-tabs-id"
            justified
            defaultActiveKey={ANNOUNCEMENT_TAB_ITEM_ID.GUIDELINES}
            className="announcement-menu"
          >
            {guidelinesTabAndContent}
            {/** summaryTabAndContent */}
            {topKeywordsCount > 0 ? semanticAnalysisTabAndContent : null}
          </Tabs>
        </div>
      </div>
    </Grid>
  );
};

export default InstructionsText;