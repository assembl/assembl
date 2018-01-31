// @flow
import React from 'react';
import { connect } from 'react-redux';
import { isCurrentPhase, getBarPercent, isStepCompleted } from '../../../utils/timeline';
import TimelineSegment, { type DebateType } from './timelineSegment';

type TimelineProps = {
  debate: DebateType,
  showNavigation: boolean,
  identifier: string,
  onMenuItemClick: Function
};

export function DumbTimeline(props: TimelineProps) {
  const { debateData } = props.debate;
  const { showNavigation, identifier, onMenuItemClick } = props;
  return (
    <div className="timeline-container">
      {debateData.timeline &&
        debateData.timeline.map((phase, index) => (
          <TimelineSegment
            title={phase.title}
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
            onMenuItemClick={onMenuItemClick}
          />
        ))}
    </div>
  );
}

const mapStateToProps = state => ({
  debate: state.debate
});

export default connect(mapStateToProps)(DumbTimeline);