import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Col, Tooltip } from 'react-bootstrap';

import StatisticsDoughnut from '../common/statisticsDoughnut';
import { sentimentDefinitionsObject } from './sentimentDefinitions';
import Video from '../survey/video';

const createTooltip = (sentiment, count) => {
  return (
    <Tooltip id={`${sentiment.camelType}Tooltip`} className="no-arrow-tooltip">
      {count} <Translate value={`debate.${sentiment.camelType}`} />
    </Tooltip>
  );
};

const getSentimentsCount = (posts) => {
  const counters = { ...sentimentDefinitionsObject };
  Object.keys(counters).forEach((key) => {
    counters[key].count = 0;
  });
  posts.edges.forEach(({ node: { sentimentCounts } }) => {
    Object.keys(counters).forEach((key) => {
      counters[key].count += sentimentCounts[key];
    });
  });
  return counters;
};

const createDoughnutElements = (sentimentCounts) => {
  return Object.keys(sentimentCounts).map((key) => {
    return {
      color: sentimentCounts[key].color,
      count: sentimentCounts[key].count,
      Tooltip: createTooltip(sentimentCounts[key], sentimentCounts[key].count)
    };
  });
};

class Announcement extends React.Component {
  render = () => {
    const { idea } = this.props.ideaWithPostsData;
    const { numContributors, numPosts, posts } = idea;
    const sentimentsCount = getSentimentsCount(posts);
    return (
      <div className="announcement">
        <div className="announcement-title">
          <div className="title-hyphen">&nbsp;</div>
          <h3 className="dark-title-1">
            <Translate value="debate.thread.announcement" />
          </h3>
        </div>
        <Col xs={12} sm={8} className="announcement-video col-sm-push-4">
          <Video
            descriptionTop={'Now we here'}
            descriptionBottom={'Started at the bottom'}
            htmlCode="https://www.youtube.com/embed/dQw4w9WgXcQ"
          />
        </Col>
        <Col xs={12} sm={4} className="col-sm-pull-8">
          <div className="announcement-statistics">
            <div className="announcement-doughnut">
              <StatisticsDoughnut elements={createDoughnutElements(sentimentsCount)} />
            </div>
            <div className="announcement-numbers">
              {numPosts} <span className="assembl-icon-message" /> - {numContributors} <span className="assembl-icon-profil" />
            </div>
          </div>
        </Col>
      </div>
    );
  };
}

export default Announcement;