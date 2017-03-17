import React from 'react';

class TimelineBar extends React.Component {
  render() {
    const { index, barWidth, isCurrentStep, isStepCompleted, title, locale } = this.props;
    return (
      <div className="minimized-timeline" style={{ marginLeft: `${index * 100}px` }}>
        <div className={isStepCompleted || isCurrentStep ? 'timeline-number active' : 'timeline-number not-active'}>{index + 1}</div>
        <div className="timeline-bar-2" style={{ width: `${barWidth}px` }}>&nbsp;</div>
        <div className="timeline-bar-1">&nbsp;</div>
        {title.entries.map((entry, index2) => {
          return (
            <div className={isCurrentStep ? 'timeline-title txt-active' : 'timeline-title txt-not-active'} key={`title-${index2}`}>{locale === entry['@language'] ? entry.value : ''}</div>
          );
        })}
        <span className={isCurrentStep ? 'arrow assembl-icon-down-dir color' : 'hidden'}>&nbsp;</span>
      </div>
    );
  }
}

export default TimelineBar;