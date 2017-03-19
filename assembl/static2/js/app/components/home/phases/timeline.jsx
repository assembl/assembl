import React from 'react';
import { connect } from 'react-redux';
import { Localize } from 'react-redux-i18n';
import { isCurrentPhase, getBarWidth } from '../../../utils/timeline';
import Pointer from '../../svg/pointer';

class Timeline extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { index } = this.props;
    const currentPhase = isCurrentPhase(index, debateData.timeline);
    const barWidth = getBarWidth(index, debateData.timeline);
    const currentDate = new Date();
    const datePosition = 100 - barWidth;
    return (
      <div className="timeline">
        {currentPhase &&
          <div>
            <div className="timeline-date" style={index === 0 ? { left: `${barWidth}%` } : { right: `${datePosition}%` }}>
              <Localize value={currentDate} dateFormat="date.format" />
            </div>
            <Pointer position={barWidth} />
          </div>
        }
        {!currentPhase &&
          <div className="trsp-pointer">&nbsp;</div>
        }
        <div className="bar" style={{ width: `${barWidth}%` }}>&nbsp;</div>
        <div className="bar-bkg">&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(Timeline);