import React from 'react';
import { connect } from 'react-redux';
import { Localize } from 'react-redux-i18n';
import { isCurrentPhase, getBarPercent } from '../../../utils/timeline';
import Pointer from '../../svg/pointer';

class Timeline extends React.Component {
  render() {
    const { index, timeline } = this.props;
    const currentPhase = isCurrentPhase(timeline[index]);
    const barPercent = getBarPercent(timeline[index]);
    const currentDate = new Date();
    const datePosition = 100 - barPercent;
    return (
      <div className="timeline">
        {currentPhase ? (
          <div>
            <div className="timeline-date" style={index === 0 ? { left: `${barPercent - 6}%` } : { right: `${datePosition}%` }}>
              <Localize value={currentDate} dateFormat="date.format" />
            </div>
            <Pointer position={barPercent} />
          </div>
        ) : (
          <div className="trsp-pointer">&nbsp;</div>
        )}
        <div className="bar" style={{ width: `${barPercent}%` }}>
          &nbsp;
        </div>
        <div className="bar-bkg">&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  timeline: state.timeline
});

export default connect(mapStateToProps)(Timeline);