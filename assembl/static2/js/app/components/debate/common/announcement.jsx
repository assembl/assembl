// @flow
import * as React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Col, Row, Tabs, Tab, Tooltip } from 'react-bootstrap';

import StatisticsDoughnut from '../common/statisticsDoughnut';
import { sentimentDefinitionsObject } from './sentimentDefinitions';
import TextAndMedia from '../../common/textAndMedia';
import { CountablePublicationStates, ANNOUNCEMENT_TAB_ITEM_ID, MESSAGE_VIEW } from '../../../constants';
import PostsAndContributorsCount, { Counter } from '../../common/postsAndContributorsCount';

import type { SentimentDefinition } from './sentimentDefinitions';

export const createTooltip = (sentiment: SentimentDefinition, count: number) => (
  <Tooltip id={`${sentiment.camelType}Tooltip`} className="no-arrow-tooltip">
    {count} <Translate value={`debate.${sentiment.camelType}`} />
  </Tooltip>
);

type SentimentsCounts = {
  [string]: SentimentDefinition & {
    count: number
  }
};

type Post = {
  node: {
    sentimentCounts: {
      [string]: number
    },
    publicationState: string
  }
};

type Posts = {
  edges: Array<Post>
};

export type AnnouncementContent = {
  body: string,
  title: ?string,
  quote?: ?string
};

type DoughnutElements = {
  Tooltip: React.Node,
  color: string,
  count: number
};

type AnnouncementCountersProps = {
  idea: {
    numContributors: number,
    numPosts: number,
    posts: Posts,
    messageColumns: IdeaMessageColumns,
    messageViewOverride: ?string
  }
};

type Props = {
  children?: React.Node,
  announcement: AnnouncementContent
};

type ColumnsInfoType = { count: ?number, color: ?string, name: ?string };

export const getColumnInfos = (messageColumns: Array<IdeaMessageColumnFragment>): Array<ColumnsInfoType> =>
  messageColumns.map(col => ({ count: col.numPosts, color: col.color, name: col.name }));

export const getSentimentsCount = (posts: Posts) => {
  const counters: SentimentsCounts = { ...sentimentDefinitionsObject };
  Object.keys(counters).forEach((key) => {
    counters[key].count = 0;
  });

  return posts.edges
    .filter(({ node: { publicationState } }) => Object.keys(CountablePublicationStates).indexOf(publicationState) > -1)
    .reduce(
      (result, { node: { sentimentCounts } }) =>
        Object.keys(result).reduce((naziLinter, key) => {
          const postCounts = naziLinter;
          postCounts[key].count += sentimentCounts[key];
          return postCounts;
        }, result),
      counters
    );
};

export const createDoughnutElements = (sentimentCounts: SentimentsCounts): Array<DoughnutElements> =>
  Object.keys(sentimentCounts).map(key => ({
    color: sentimentCounts[key].color,
    count: sentimentCounts[key].count,
    Tooltip: createTooltip(sentimentCounts[key], sentimentCounts[key].count)
  }));

export const AnnouncementCounters = ({ idea }: AnnouncementCountersProps) => {
  const { numContributors, numPosts, posts, messageColumns, messageViewOverride } = idea;
  const isMultiColumns = messageViewOverride === MESSAGE_VIEW.messageColumns;
  const sentimentsCount = getSentimentsCount(posts);
  const columnInfos = getColumnInfos(messageColumns);
  const doughnutElements = isMultiColumns ? columnInfos : createDoughnutElements(sentimentsCount);

  const instructionTitleKey = 'debate.thread.instruction';
  const mindmapTitleKey = 'debate.thread.mindmap';
  const semanticAnalysisLongTitleKey = 'debate.thread.semanticAnalysis.long';
  // const semanticAnalysisShortTitleKey = 'debate.thread.semanticAnalysis.short';

  const instructionTabTitle = I18n.t(instructionTitleKey);
  const mindmapTabTitle = I18n.t(mindmapTitleKey);
  const semanticAnalysisTabLongTitle = I18n.t(semanticAnalysisLongTitleKey);
  // const semanticAnalysisTabShortTitle = I18n.t(semanticAnalysisShortTitleKey);

  const instructionContent = (
    <React.Fragment>
      <Col xs={12} md={4} className="col-md-pull-8">
        <div className="announcement-statistics">
          <div className="announcement-doughnut">
            <StatisticsDoughnut elements={doughnutElements} />
          </div>
          {isMultiColumns ? (
            <div className="announcement-numbers">
              {columnInfos.map((col, index) => (
                <div style={{ color: col.color }} key={`col-${index}`}>
                  {col.count} <span className="col-announcement-count">{col.name}</span>
                </div>
              ))}
              <Counter num={numContributors} className="assembl-icon assembl-icon-profil" />
            </div>
          ) : (
            <PostsAndContributorsCount className="announcement-numbers" numContributors={numContributors} numPosts={numPosts} />
          )}
        </div>
      </Col>
    </React.Fragment>
  );

  const mindmapContent = <h1>A retenir</h1>;

  const semanticAnalysisContent = <h1>Analyse sémantique</h1>;

  return (
    <div className="announcement">
      {/** will need to update the overall structure to remove announcement css class */}
      <Tabs defaultActiveKey={ANNOUNCEMENT_TAB_ITEM_ID.INSTRUCTION}>
        <Tab eventKey={ANNOUNCEMENT_TAB_ITEM_ID.INSTRUCTION} title={instructionTabTitle}>
          {instructionContent}
        </Tab>
        <Tab eventKey={ANNOUNCEMENT_TAB_ITEM_ID.MINDMAP} title={mindmapTabTitle}>
          {mindmapContent}
        </Tab>
        <Tab eventKey={ANNOUNCEMENT_TAB_ITEM_ID.SEMANTIC_ANALYSIS} title={semanticAnalysisTabLongTitle}>
          {semanticAnalysisContent}
        </Tab>
      </Tabs>
    </div>
  );
};

const Announcement = ({ children, announcement }: Props) => (
  <div className="announcement">
    <div className="announcement-title">
      <div className="title-hyphen">&nbsp;</div>
      <h3 className="announcement-title-text dark-title-1">
        {announcement.title ? announcement.title : <Translate value="debate.thread.announcement" />}
      </h3>
    </div>
    <Row>
      <TextAndMedia {...announcement}>{children}</TextAndMedia>
    </Row>
  </div>
);

Announcement.defaultProps = {
  children: null
};

export default Announcement;