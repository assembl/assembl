import React from 'react';
import { connect } from 'react-redux';
import { isCurrentPhase, getBarPercent, isStepCompleted } from '../../../utils/timeline';
import TimelineSegment from './timelineSegment';

class Timeline extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { locale } = this.props.i18n;
    const { showNavigation, identifier } = this.props;
    return (
      <div className="timeline-container">
        {debateData.timeline &&
          debateData.timeline.map((phase, index) => (
            <TimelineSegment
              title={phase.title}
              locale={locale}
              index={index}
              key={index}
              barPercent={getBarPercent(debateData.timeline[index])}
              isCurrentPhase={isCurrentPhase(debateData.timeline[index])}
              showNavigation={showNavigation}
              identifier={identifier}
              phaseIdentifier={phase.identifier}
              startDate={phase.start}
              endDate={phase.end}
              isStepCompleted={isStepCompleted(phase)}
            />
          ))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate,
  i18n: state.i18n
});

export default connect(mapStateToProps)(Timeline);