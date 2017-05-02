import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { get } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';

class TimelineSegment extends React.Component {
  render() {
    const slug = { slug: getDiscussionSlug() };
    const {
      index,
      barWidth,
      isCurrentPhase,
      isStepCompleted,
      identifier,
      phaseIdentifier,
      title,
      locale
    } = this.props;
    return (
      <div className="minimized-timeline" style={{ marginLeft: `${index * 100}px` }}>
        {title.entries.map((entry, index2) => {
          if (locale === entry['@language']) {
            return (
              <div className={identifier === phaseIdentifier ? 'timeline-title txt-active' : 'timeline-title txt-not-active'} key={index2}>
                <Link to={isStepCompleted || isCurrentPhase ? `${get('debate', slug)}?phase=${phaseIdentifier}` : null}>
                  { entry.value }
                </Link>
              </div>
            );
          }
        })}
        <div className={isStepCompleted || isCurrentPhase ? 'timeline-number active' : 'timeline-number not-active'}>
          {isStepCompleted ? <span className="assembl-icon-checked white" /> : <span>{index + 1}</span>}
        </div>
        <div className="timeline-bar-2" style={{ width: `${barWidth}px` }}>&nbsp;</div>
        <div className="timeline-bar-1">&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(TimelineSegment);