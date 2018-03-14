// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Tooltip } from 'react-bootstrap';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import Doughnut from '../../svg/doughnut';

const createTooltip = (category, count, color) => (
  <Tooltip id={`${category}-tooltip`} className="no-arrow-tooltip sentiment-header-tooltip" style={{ backgroundColor: color }}>
    <Translate value={`debate.${category}Count`} count={count} />
  </Tooltip>
);

// TODO replace by the query
const elements = [
  {
    color: '#46d38d',
    count: 12,
    Tooltip: createTooltip('agree', 12, '#46d38d')
  },
  {
    color: '#f75959',
    count: 27,
    Tooltip: createTooltip('disagree', 27, '#f75959')
  }
];

const totalCount = elements.reduce((result, element) => result + element.count, 0);

// TODO add action-button class in the styleguide
const headerActions = () => (
  <div className="header-actions-container">
    <div className="share-button action-button">
      <div className="share-icon-container white">
        <span className="assembl-icon-share" />
      </div>
      <div className="action-button-label">
        <Translate value="debate.share" />
      </div>
    </div>
    <div className="like-button action-button">
      <Like size={30} color="#ffffff" backgroundColor="none" />
      <div className="action-button-label">
        <Translate value="debate.agree" />
      </div>
    </div>
    <div className="disagree-button action-button">
      <Disagree size={30} color="#ffffff" backgroundColor="none" />
      <div className="action-button-label">
        <Translate value="debate.disagree" />
      </div>
    </div>
    <div className="doughnut-container">
      <Doughnut elements={elements} />
      <div className="total-count-container">
        <div className="total-count">{totalCount}</div>
        <div className="count-label">
          {totalCount > 1 ? <Translate value="debate.votes" /> : <Translate value="debate.vote" />}
        </div>
      </div>
    </div>
  </div>
);

export default headerActions;