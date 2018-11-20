// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { Col, Tooltip } from 'react-bootstrap';

import StatisticsDoughnut from '../common/statisticsDoughnut';
import { sentimentDefinitionsObject } from './sentimentDefinitions';
import type { SentimentDefinition } from './sentimentDefinitions';
import TextAndMedia from '../../common/textAndMedia';
import { CountablePublicationStates } from '../../../constants';
import PostsAndContributorsCount from '../../common/postsAndContributorsCount';

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
  title?: string, // The component is currently set with the boolean noTitle,
  __typename?: string
};

type DoughnutElements = {
  Tooltip: React.Node,
  color: string,
  count: number
};

type Props = {
  isMultiColumns: boolean,
  announcementContent: AnnouncementContent,
  idea: Idea
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

export const dirtySplitHack = (announcementContent: AnnouncementContent) => {
  const body = announcementContent.body;
  // To allow edit from V1 announcement, add !split!https://video.url!split!
  const split = body.split('!split!');
  return split.length >= 3
    ? {
      descriptionTop: `${split[0]}</p>`,
      descriptionBottom: `<p>${split[2]}`,
      htmlCode: split[1],
      noTitle: true
    }
    : {
      descriptionTop: body,
      descriptionBottom: null,
      htmlCode: null,
      noTitle: true
    };
};

const Announcement = ({ idea, announcementContent, isMultiColumns }: Props) => {
  const { numContributors, numPosts, posts, messageColumns } = idea;
  const sentimentsCount = getSentimentsCount(posts);
  const mediaContent = announcementContent.body && dirtySplitHack(announcementContent);
  const columnInfos = getColumnInfos(messageColumns);
  const doughnutElements = isMultiColumns ? columnInfos : createDoughnutElements(sentimentsCount);
  return (
    <div className="announcement">
      <div className="announcement-title">
        <div className="title-hyphen">&nbsp;</div>
        <h3 className="announcement-title-text dark-title-1">
          <Translate value="debate.thread.announcement" />
        </h3>
      </div>
      <Col xs={12} md={8} className="announcement-media col-md-push-4">
        {mediaContent ? <TextAndMedia {...mediaContent} /> : null}
      </Col>
      <Col xs={12} md={4} className="col-md-pull-8">
        <div className="announcement-statistics">
          <div className="announcement-doughnut">
            <StatisticsDoughnut elements={doughnutElements} />
          </div>
          {isMultiColumns ? (
            <div className="announcement-numbers-multicol">
              {columnInfos.map((col, index) => (
                <div style={{ color: col.color }} key={`col-${index}`}>
                  {col.count} <span className="col-announcement-count">{col.name}</span>
                </div>
              ))}
              <div className="color">
                {numContributors} <span className="assembl-icon-profil" />
              </div>
            </div>
          ) : (
            <div className="announcement-numbers">
              <PostsAndContributorsCount className="announcement-numbers" numContributors={numContributors} numPosts={numPosts} />
            </div>
          )}
        </div>
      </Col>
    </div>
  );
};

Announcement.displayName = 'Announcement';

export default Announcement;