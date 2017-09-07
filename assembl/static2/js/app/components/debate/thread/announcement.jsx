import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Col, Tooltip } from 'react-bootstrap';

import Doughnut from '../../svg/doughnut';
import { sentimentDefinitionsObject } from './sentimentDefinitions';
import '../../../../../css/components/announcement.scss';
import Video from '../survey/video';

const createTooltip = (sentiment, count) => {
  return (
    <Tooltip id={`${sentiment.camelType}Tooltip`} className="no-arrow-tooltip">{`${count} ${I18n.t(
      `debate.${sentiment.camelType}`
    )}`}</Tooltip>
  );
};

export const StatisticsDoughnut = ({ elements }) => {
  const totalCount = elements.reduce((result, element) => {
    return result + element.count;
  }, 0);
  return (
    <div className="statistics-container">
      <div className="statistics">
        <div className="superpose-label superpose">
          <div className="doughnut-label-count">
            {totalCount}
          </div>
          <div className="doughnut-label-text">
            <Translate value="debate.survey.reactions" />
          </div>
        </div>
        <div className="superpose">
          <Doughnut elements={elements} />
        </div>
      </div>
    </div>
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
        <Col xs={12} md={3} className="announcement-left">
          <div className="announcement-title">
            <div className="title-hyphen">&nbsp;</div>
            <h3 className="dark-title-1">
              <Translate value="debate.thread.announcement" />
            </h3>
          </div>
          <div className="announcement-bottom">
            <div style={{ width: '200px', height: '200px' }} className="announcement-doughnut">
              <StatisticsDoughnut elements={createDoughnutElements(sentimentsCount)} />
            </div>
            <div>
              {numPosts} <span className="assembl-icon-message" /> - {numContributors} <span className="assembl-icon-profil" />
            </div>
          </div>
        </Col>
        <Col xs={12} md={9} className="announcement-right">
          <Video
            descriptionTop={'Now we here'}
            descriptionBottom={'Started at the bottom'}
            htmlCode="https://www.youtube.com/embed/dQw4w9WgXcQ"
          />
        </Col>
      </div>
    );
  };
}

export default Announcement;