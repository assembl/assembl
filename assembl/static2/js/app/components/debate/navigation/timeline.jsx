// @flow
import React from 'react';

import { isCurrentPhase, getBarPercent, isStepCompleted } from '../../../utils/timeline';
import TimelineSegment, { type DebateType } from './timelineSegment';

type TimelineProps = {
  debate: DebateType,
  showNavigation: boolean,
  identifier: string,
  activeSegment: number,
  onItemSelect: Function,
  onItemDeselect: Function
};

export function DumbTimeline({ debate, activeSegment, showNavigation, identifier, onItemSelect, onItemDeselect }: TimelineProps) {
  const { debateData } = debate;
  return (
    <div className="timeline-container">
      {debateData.timeline &&
        debateData.timeline.map((phase, index) => (
          <TimelineSegment
            title={phase.title}
            index={index}
            active={index === activeSegment}
            key={index}
            barPercent={getBarPercent(debateData.timeline[index])}
            isCurrentPhase={isCurrentPhase(debateData.timeline[index])}
            showNavigation={showNavigation}
            identifier={identifier}
            phaseIdentifier={phase.identifier}
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