// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { Col, Tooltip } from 'react-bootstrap';
// Components imports
import StatisticsDoughnut from '../common/statisticsDoughnut';
import { sentimentDefinitionsObject, type SentimentDefinition } from './sentimentDefinitions';
import TextAndMedia from '../../common/textAndMedia';
import { CountablePublicationStates, MESSAGE_VIEW } from '../../../constants';
import PostsAndContributorsCount, { Counter } from '../../common/postsAndContributorsCount';
import ThematicTabs from './thematicTabs';
// GraphQL imports
import SemanticAnalysisForThematicQuery from '../../../graphql/SemanticAnalysisForThematicQuery.graphql';

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

type SurveyAnnouncementProps = {
  announcement: AnnouncementContent,
  semanticAnalysisForThematicData: SemanticAnalysisForThematicQuery
};

type Props = {
  announcement: AnnouncementContent,
  idea: {
    numContributors: number,
    numPosts: number,
    posts: Posts,
    messageColumns: IdeaMessageColumns,
    messageViewOverride: ?string
  },
  semanticAnalysisForThematicData: SemanticAnalysisForThematicQuery
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

export const SurveyAnnouncement = ({ announcement, semanticAnalysisForThematicData }: SurveyAnnouncementProps) => {
  const guidelinesContent = (
    <div className="announcement">
      <div className="announcement-title">
        {announcement.title ? <h3 className="announcement-title-text dark-title-1">{announcement.title}</h3> : ''}
      </div>
      <TextAndMedia {...announcement} />
    </div>
  );

  return <ThematicTabs guidelinesContent={guidelinesContent} semanticAnalysisForThematicData={semanticAnalysisForThematicData} />;
};

export const Announcement = ({ announcement, idea, semanticAnalysisForThematicData }: Props) => {
  const { numContributors, numPosts, posts, messageColumns, messageViewOverride } = idea;
  const isMultiColumns = messageViewOverride === MESSAGE_VIEW.messageColumns;
  const sentimentsCount = getSentimentsCount(posts);
  const columnInfos = getColumnInfos(messageColumns);
  const doughnutElements = isMultiColumns ? columnInfos : createDoughnutElements(sentimentsCount);

  const guidelinesContent = (
    <div className="announcement">
      <div className="announcement-title">
        <h3 className="announcement-title-text dark-title-1">
          {announcement.title || <Translate value="debate.thread.announcement" />}
        </h3>
      </div>
      <Col xs={12} md={10} className="announcement-media col-md-push-2 no-padding">
        <TextAndMedia {...announcement} />
      </Col>
      <Col xs={12} md={2} className="col-md-pull-10 announcement-statistics-container">
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
    </div>
  );

  return <ThematicTabs guidelinesContent={guidelinesContent} semanticAnalysisForThematicData={semanticAnalysisForThematicData} />;
};

const announcementDefaultProps = {
  semanticAnalysisForThematicData: {
    nlpSentiment: {
      positive: null,
      negative: null,
      count: 0
    },
    title: '',
    topKeywords: []
  }
};

SurveyAnnouncement.defaultProps = { ...announcementDefaultProps };

Announcement.defaultProps = {
  ...announcementDefaultProps
};

export default Announcement;