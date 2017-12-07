import React from 'react';
import { Translate } from 'react-redux-i18n';

import Doughnut from '../../svg/doughnut';

const StatisticsDoughnut = ({ elements, placement }) => {
  const totalCount = elements.reduce((result, element) => result + element.count, 0);
  const placeAfter = placement === 'after';
  const className = placeAfter ? 'after' : 'superpose';
  return (
    <div className="statistics-doughnut">
      <div className="statistics">
        <div className={`doughnut-container ${!placeAfter ? 'superpose' : ''}`}>
          <Doughnut elements={elements} />
        </div>
        <div className={`superpose-label ${className}`}>
          <div className="doughnut-label-count">{totalCount}</div>
          {placeAfter ? ' ' : ''}
          <div className="doughnut-label-text">
            <Translate value="debate.survey.reactions" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDoughnut;