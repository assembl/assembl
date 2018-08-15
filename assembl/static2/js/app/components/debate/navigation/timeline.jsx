// @flow
import * as React from 'react';
import { isCurrentPhase, getBarPercent, isStepCompleted } from '../../../utils/timeline';
import TimelineSegment from './timelineSegment';

type TimelineProps = {
  timeline: Timeline,
  showNavigation: boolean,
  activeSegment: number,
  onItemSelect: Function,
  onItemDeselect: Function
};

export function DumbTimeline({ timeline, activeSegment, showNavigation, onItemSelect, onItemDeselect }: TimelineProps) {
  return (
    <div className="timeline-container">
      {timeline &&
        timeline.map((phase, index) => (
          <TimelineSegment
            title={phase.title}
            index={index}
            active={index === activeSegment}
            key={index}
            barPercent={getBarPercent(timeline[index])}
            isCurrentPhase={isCurrentPhase(timeline[index])}
            showNavigation={showNavigation}
            phaseIdentifier={phase.identifier}
            phaseId={phase.id}
            startDate={phase.start}
            endDate={phase.end}
            isStepCompleted={isStepCompleted(phase)}
            onSelect={onItemSelect}
            onDeselect={onItemDeselect}
          />
        ))}
    </div>
  );
}

export default DumbTimeline;