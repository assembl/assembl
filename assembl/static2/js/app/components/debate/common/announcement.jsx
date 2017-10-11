import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Col, Tooltip } from 'react-bootstrap';

import StatisticsDoughnut from '../common/statisticsDoughnut';
import { sentimentDefinitionsObject } from './sentimentDefinitions';
import Media from '../../common/media';
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

class Announcement extends React.Component {
  getColumnInfos(messageColumns, posts) {
    const columnsArray = [];
    messageColumns.forEach((col) => {
      const keyName = col.messageClassifier;
      let count = 0;
      posts.forEach((post) => {
        if (post.node.messageClassifier === keyName) {
          count += 1;
        }
      });
      columnsArray.push({ count: count, color: col.color, name: col.name });
    });

    return columnsArray;
  }
  render = () => {
    const { ideaWithPostsData: { idea }, announcementContent } = this.props;
    const isTwoColumns = idea.messageColumns.length > 0;
    const { numContributors, numPosts, posts } = idea;
    const sentimentsCount = getSentimentsCount(posts);
    const mediaContent = dirtySplitHack(announcementContent);
    const columnInfos = this.getColumnInfos(idea.messageColumns, posts.edges);
    const doughnutsElements = isTwoColumns ? columnInfos : createDoughnutElements(sentimentsCount);
    return (
      <div className="announcement">
        <div className="announcement-title">
          <div className="title-hyphen">&nbsp;</div>
          <h3 className="announcement-title-text dark-title-1">
            <Translate value="debate.thread.announcement" />
          </h3>
        </div>
        <Col xs={12} md={8} className="announcement-media col-md-push-4">
          <Media {...mediaContent} />
        </Col>
        <Col xs={12} md={4} className="col-md-pull-8">
          <div className="announcement-statistics">
            <div className="announcement-doughnut">
              <StatisticsDoughnut elements={doughnutsElements} />
            </div>
            {isTwoColumns
              ? <div
                className="announcement-numbers-twoCol"
                style={{ fontSize: 18, width: 130, textAlign: 'left', paddingLeft: 25 }}
              >
                {columnInfos.map((col, index) => {
                  return (
                    <div style={{ color: col.color }} key={`col-${index}`}>
                      {col.count} <span style={{ fontSize: 12, paddingLeft: 0 }}>{col.name}</span>
                    </div>
                  );
                })}
                <div style={{ color: '#5C0FD9' }}>
                  {numContributors} <span className="assembl-icon-profil" />
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