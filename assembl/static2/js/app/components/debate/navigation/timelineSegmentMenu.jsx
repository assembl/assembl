// @flow
import React from 'react';
import { Translate, Localize } from 'react-redux-i18n';

import MenuTable from './menuTable';
import { getPhaseStatus } from '../../../utils/timeline';
import { PHASE_STATUS } from '../../../constants';
import { phasesToIgnore } from './timelineSegment';

type TimelineSegmentMenuProps = {
  title: string,
  startDate: string,
  endDate: string,
  phaseIdentifier: string,
  phaseId: string,
  onMenuItemClick: Function
};

export function DumbTimelineSegmentMenu({
  phaseIdentifier,
  phaseId,
  onMenuItemClick,
  startDate,
  endDate,
  title
}: TimelineSegmentMenuProps) {
  const phaseStatus = getPhaseStatus(startDate, endDate);
  const isNotStarted = phaseStatus === PHASE_STATUS.notStarted;
  if (isNotStarted) {
    return (
      <div className="menu-container">
        <div className="not-started">
          <Translate value="debate.notStarted" phaseName={title} />
          <Localize value={startDate} dateFormat="date.format" />
        </div>
      </div>
    );
  }
  const ignoreMenu = phasesToIgnore.includes(phaseIdentifier);
  return !ignoreMenu ? (
    <div className="menu-container">
      <MenuTable identifier={phaseIdentifier} phaseId={phaseId} onMenuItemClick={onMenuItemClick} />
    </div>
  ) : null;
}

export default DumbTimelineSegmentMenu;