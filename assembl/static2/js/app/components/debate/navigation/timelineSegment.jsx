import React from 'react';

class TimelineSegment extends React.Component {
  render() {
    const {
      index,
      barWidth,
      isCurrentPhase,
      showNavigation,
      isStepCompleted,
      title,
      locale
    } = this.props;
    return (
      <div className="minimized-timeline" style={{ marginLeft: `${index * 100}px` }}>
        <div className={isStepCompleted || isCurrentPhase ? 'timeline-number active' : 'timeline-number not-active'}>
          {index + 1}
        </div>
        <div className="timeline-bar-2" style={{ width: `${barWidth}px` }}>&nbsp;</div>
        <div className="timeline-bar-1">&nbsp;</div>
        {title.entries.map((entry, index2) => {
          return (
            <div className={isCurrentPhase ? 'timeline-title txt-active' : 'timeline-title txt-not-active'} key={`title-${index2}`}>
              {locale === entry['@language'] ? entry.value : ''}
            </div>
          );
        })}
        <span className={isCurrentPhase && showNavigation ? 'arrow assembl-icon-down-dir color' : 'hidden'}>&nbsp;</span>
      </div>
    );
  }
}

export default TimelineSegment;