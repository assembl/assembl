import React from 'react';
import { connect } from 'react-redux';
import { Localize } from 'react-redux-i18n';
import MapStateToProps from '../../../store/mapStateToProps';
import { getDateFromString, isDateExpired, getNumberOfDays, calculatePercentage } from '../../../utils/globalFunctions';
import Pointer from '../../svg/pointer';

class Timeline extends React.Component {
  getBarWidth() {
    const { debateData } = this.props.debate;
    const index = this.props.index;
    const currentDate = new Date();
    const endDate = getDateFromString(debateData.timeline[index].endDate);
    const isStepCompleted = isDateExpired(currentDate, endDate);
    let barWidth = 0;
    if (isStepCompleted) {
      barWidth = 100;
    } else {
      const startDate = getDateFromString(debateData.timeline[index].startDate);
      const isStepStarted = isDateExpired(currentDate, startDate);
      if (isStepStarted) {
        const remainingDays = getNumberOfDays(endDate, currentDate);
        const totalDays = getNumberOfDays(endDate, startDate);
        const percentage = calculatePercentage(remainingDays, totalDays);
        barWidth = 100 - percentage;
      }
    }
    return barWidth;
  }
  render() {
    const currentStep = this.props.currentStep;
    const index = this.props.index;
    const barWidth = this.getBarWidth();
    const currentDate = new Date();
    const datePosition = 100 - barWidth;
    return (
      <div className="timeline">
        {currentStep &&
          <div>
            <div className="timeline-date" style={index === 0 ? { left: `${barWidth}%` } : { right: `${datePosition}%` }}>
              <Localize value={currentDate} dateFormat="date.format" />
            </div>
            <Pointer position={barWidth} />
          </div>
        }
        {!currentStep &&
          <div className="trsp-pointer">&nbsp;</div>
        }
        <div className="bar" style={{ width: `${barWidth}%` }}>&nbsp;</div>
        <div className="bar-bkg">&nbsp;</div>
      </div>
    );
  }
}

export default connect(MapStateToProps)(Timeline);