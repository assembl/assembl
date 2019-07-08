// @flow
import * as React from 'react';
import { isCurrentPhase, getBarPercent, isStepCompleted } from '../../../utils/timeline';
import TimelineSegment from './timelineSegment';
import TimelineSegmentMenu from './timelineSegmentMenu';

type TimelineProps = {
  timeline: Timeline,
  activeSegmentPhase: Phase,
  showNavigation: boolean,
  activeSegment: number,
  hideMenu: Function,
  showSegmentMenu: Function
};

export function DumbTimeline({
  timeline,
  hideMenu,
  activeSegment,
  activeSegmentPhase,
  showSegmentMenu,
  showNavigation
}: TimelineProps) {
  return (
    <div className="timeline-container">
      {timeline &&
        timeline.map((phase, index) => (
          <React.Fragment key={index}>
            <TimelineSegment
              title={phase.title}
              index={index}
              active={index === activeSegment}
              barPercent={getBarPercent(timeline[index])}
              isCurrentPhase={isCurrentPhase(timeline[index])}
              showNavigation={showNavigation}
              phaseIdentifier={phase.identifier}
              phaseId={phase.id}
              startDate={phase.start}
              endDate={phase.end}
              isStepCompleted={isStepCompleted(phase)}
              showSegmentMenu={showSegmentMenu}
            />
            {index === activeSegment ? (
              <TimelineSegmentMenu
                phaseIdentifier={activeSegmentPhase.identifier}
                phaseId={activeSegmentPhase.id}
                title={activeSegmentPhase.title}
                onMenuItemClick={hideMenu}
                startDate={activeSegmentPhase.start}
                endDate={activeSegmentPhase.end}
              />
            ) : null}
          </React.Fragment>
        ))}
    </div>
  );
}

export default DumbTimeline;