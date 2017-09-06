import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Col, Tooltip } from 'react-bootstrap';

import Doughnut from '../../svg/doughnut';
import { sentimentDefinitionsObject } from './sentimentDefinitions';
import '../../../../../css/components/announcement.scss';
import Video from '../../home/video';

const createTooltip = (sentiment, count) => {
  return (
    <Tooltip id={`${sentiment.camelType}Tooltip`}>
      {`${count} ${I18n.t(`debate.${sentiment.camelType}`)}`}
    </Tooltip>
  );
};

class Announcement extends React.Component {
  render = () => {
    const { idea } = this.props.ideaWithPostsData;
    const { numContributors, numPosts } = idea;
    return (
      <div className="announcement">
        <Col xs={12} md={4}>
          <h3 className="announcement-title">
            <Translate value="debate.thread.announcement" />
          </h3>
          <div className="statistics-container">
            <div className="statistics">
              <div className="superpose-label superpose">
                <div>
                  {168}
                </div>
                <div>
                  <Translate value="debate.survey.reactions" />
                </div>
              </div>
              <div className="superpose">
                <Doughnut
                  elements={[
                    {
                      color: sentimentDefinitionsObject.dontUnderstand.color,
                      count: 2,
                      Tooltip: createTooltip(sentimentDefinitionsObject.dontUnderstand, 2)
                    },
                    {
                      color: sentimentDefinitionsObject.moreInfo.color,
                      count: 5,
                      Tooltip: createTooltip(sentimentDefinitionsObject.moreInfo, 5)
                    },
                    {
                      color: sentimentDefinitionsObject.like.color,
                      count: 6,
                      Tooltip: createTooltip(sentimentDefinitionsObject.like, 6)
                    },
                    {
                      color: sentimentDefinitionsObject.disagree.color,
                      count: 6,
                      Tooltip: createTooltip(sentimentDefinitionsObject.disagree, 6)
                    }
                  ]}
                />
              </div>
            </div>
          </div>
          <section>
            {numPosts} <span className="assembl-icon-message" /> - {numContributors} <span className="assembl-icon-profil" />
          </section>
        </Col>
        <Col xs={12} md={8}>
          <Video />
        </Col>
      </div>
    );
  };
}

export default Announcement;