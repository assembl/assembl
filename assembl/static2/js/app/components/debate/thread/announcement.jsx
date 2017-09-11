import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Col, Tooltip } from 'react-bootstrap';

import StatisticsDoughnut from '../common/statisticsDoughnut';
import { sentimentDefinitionsObject } from './sentimentDefinitions';
import Video from '../survey/video';
import { PublicationStates } from '../../../constants';

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
  posts.edges.forEach(({ node: { sentimentCounts, publicationState } }) => {
    if (publicationState === PublicationStates.PUBLISHED) {
      Object.keys(counters).forEach((key) => {
        counters[key].count += sentimentCounts[key];
      });
    }
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

const dirtySplitHack = (announcementBody) => {
  const split = announcementBody.split('!split!');
  return {
    topDesc: `${split[0]}</p>`,
    botDesc: `<p>${split[2]}`,
    videoURL: split[1]
  };
};

class Announcement extends React.Component {
  render = () => {
    const { ideaWithPostsData: { idea }, announcementBody } = this.props;
    const { numContributors, numPosts, posts } = idea;
    const sentimentsCount = getSentimentsCount(posts);
    const { topDesc, botDesc, videoURL } = dirtySplitHack(announcementBody);
    console.log('topDesc', topDesc, 'botDesc', botDesc, 'videoURLqs', videoURL);
    return (
      <div className="announcement">
        <div className="announcement-title">
          <div className="title-hyphen">&nbsp;</div>
          <h3 className="announcement-title-text dark-title-1">
            <Translate value="debate.thread.announcement" />
          </h3>
        </div>
        <Col xs={12} sm={8} className="announcement-video col-sm-push-4">
          <Video descriptionTop={topDesc} descriptionBottom={botDesc} htmlCode={videoURL} />
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