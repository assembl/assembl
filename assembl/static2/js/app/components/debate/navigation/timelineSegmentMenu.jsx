// @flow
import React from 'react';
import { Translate, Localize } from 'react-redux-i18n';
import { connect } from 'react-redux';

import MenuTable from './menuTable';
import { getPhaseStatus } from '../../../utils/timeline';
import { PHASE_STATUS } from '../../../constants';
import { phasesToIgnore } from './timelineSegment';

type TimelineSegmentMenuProps = {
  title: {
    entries: Array<*>
  },
  startDate: string,
  endDate: string,
  phaseIdentifier: string,
  locale: string,
  onMenuItemClick: Function
};

export function DumbTimelineSegmentMenu({
  phaseIdentifier,
  onMenuItemClick,
  startDate,
  endDate,
  title,
  locale
}: TimelineSegmentMenuProps) {
  const phaseStatus = getPhaseStatus(startDate, endDate);
  const isNotStarted = phaseStatus === PHASE_STATUS.notStarted;
  if (isNotStarted) {
    let phaseName = '';
    title.entries.forEach((entry) => {
      if (locale === entry['@language']) {
        phaseName = entry.value.toLowerCase();
      }
    });
    return (
      <div className="menu-container">
        <div className="not-started">
          <Translate value="debate.notStarted" phaseName={phaseName} />
          <Localize value={startDate} dateFormat="date.format" />
        </div>
      </div>
    );
  }
  const ignoreMenu = phasesToIgnore.includes(phaseIdentifier) && phaseStatus !== PHASE_STATUS.inProgress;
  return !ignoreMenu ? (
    <div className="menu-container">
      <MenuTable identifier={phaseIdentifier} onMenuItemClick={onMenuItemClick} />
    </div>
  ) : null;
}

const mapStateToProps = state => ({
  locale: state.i18n.locale
});

export default connect(mapStateToProps)(DumbTimelineSegmentMenu);