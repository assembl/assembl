// @flow
import * as React from 'react';
import { isCurrentPhase, getBarPercent, isStepCompleted } from '../../../utils/timeline';
import TimelineSegment from './timelineSegment';
import TimelineSegmentMenu from './timelineSegmentMenu';

type TimelineProps = {
  timeline: Timeline,
  showNavigation: boolean,
  activeSegment: number,
  onItemSelect: Function,
  onItemDeselect: Function
};

export function DumbTimeline({
  timeline,
  activeSegmentPhase,
  showSegmentMenu,
  activeSegment,
  showNavigation,
  onItemSelect,
  onItemDeselect,
  hideMenu
}: TimelineProps) {
  return (
    <div className="timeline-container">
      {timeline &&
        timeline.map((phase, index) => (
          <React.Fragment>
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
              onMenuItemClick={hideMenu}
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