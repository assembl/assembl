import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Col, Tooltip } from 'react-bootstrap';

import StatisticsDoughnut from '../common/statisticsDoughnut';
import { sentimentDefinitionsObject } from './sentimentDefinitions';
import Video from './video';
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

const dirtySplitHack = (announcementContent) => {
  const body = announcementContent.body;
  // To allow edit from V1 announcement, add !split!https://video.url!split!
  const split = body.split('!split!');
  return split.length >= 3
    ? {
      descriptionTop: `${split[0]}</p>`,
      descriptionBottom: `<p>${split[2]}`,
      htmlCode: split[1]
    }
    : {
      descriptionTop: body,
      descriptionBottom: null,
      htmlCode: null
    };
};

class Announcement extends React.Component {
  render = () => {
    const { ideaWithPostsData: { idea }, announcementContent } = this.props;
    const isTwoColumns = true; // a field needs to be added to the idea graphQL object
    const { numContributors, numPosts, posts } = idea;
    const sentimentsCount = getSentimentsCount(posts);
    const positiveNegativeCount = [
      { color: '#50D593', count: 10 },
      { color: '#F75959', count: 8 },
      { color: '#00B6FF', count: 2 }
    ]; // testing the doughnut display
    const doughnutsElements = isTwoColumns ? positiveNegativeCount : createDoughnutElements(sentimentsCount);
    const videoContent = dirtySplitHack(announcementContent);
    return (
      <div className="announcement">
        <div className="announcement-title">
          <div className="title-hyphen">&nbsp;</div>
          <h3 className="announcement-title-text dark-title-1">
            <Translate value="debate.thread.announcement" />
          </h3>
        </div>
        <Col xs={12} sm={8} className="announcement-video col-sm-push-4">
          <Video {...videoContent} />
        </Col>
        <Col xs={12} sm={4} className="col-sm-pull-8">
          <div className="announcement-statistics">
            <div className="announcement-doughnut">
              <StatisticsDoughnut elements={doughnutsElements} />
            </div>
            {isTwoColumns
              ? <div className="announcement-numbers-twoCol" style={{ fontSize: 20 }}>
                <div style={{ color: '#50D593' }}>
                  {positiveNegativeCount[0].count} Pour
                </div>
                <div style={{ color: '#F75959' }}>
                  {positiveNegativeCount[1].count} Contre
                </div>
                <div style={{ color: '#00B6FF' }}>
                  {positiveNegativeCount[2].count} Alternatives
                </div>
              </div>
              : <div className="announcement-numbers">
                {numPosts} <span className="assembl-icon-message" /> - {numContributors}{' '}
                <span className="assembl-icon-profil" />
              </div>}
          </div>
        </Col>
      </div>
    );
  };
}

export default Announcement;