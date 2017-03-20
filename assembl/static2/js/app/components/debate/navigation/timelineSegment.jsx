import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

class TimelineSegment extends React.Component {
  render() {
    const { rootPath } = this.props.context;
    const { debateData } = this.props.debate;
    const {
      index,
      barWidth,
      isCurrentPhase,
      showNavigation,
      isStepCompleted,
      identifier,
      queryIdentifier,
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
            <div className={identifier === queryIdentifier ? 'timeline-title txt-active' : 'timeline-title txt-not-active'} key={`title-${index2}`}>
              <Link to={`${rootPath}${debateData.slug}/debate?phase=${identifier}`}>{locale === entry['@language'] ? entry.value : ''}</Link>
            </div>
          );
        })}
        <span className={identifier === queryIdentifier && showNavigation ? 'arrow assembl-icon-down-dir color' : 'hidden'}>&nbsp;</span>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context
  };
};

export default connect(mapStateToProps)(TimelineSegment);