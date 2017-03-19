import React from 'react';
import { connect } from 'react-redux';
import { isCurrentPhase, isStepCompleted, getBarWidth } from '../../../utils/timeline';
import TimelineSegment from './timelineSegment';

class Timeline extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { locale } = this.props.i18n;
    const { showNavigation, queryIdentifier } = this.props;
    return (
      <section className="timeline-section">
        <div className="max-container">
          {debateData.timeline.map((phase, index) => {
            return (
              <TimelineSegment
                title={phase.title}
                locale={locale}
                index={index}
                key={`timeline-${index}`}
                barWidth={getBarWidth(index, debateData.timeline)}
                isCurrentPhase={isCurrentPhase(index, debateData.timeline)}
                isStepCompleted={isStepCompleted(index, debateData.timeline)}
                showNavigation={showNavigation}
                queryIdentifier={queryIdentifier}
                identifier={phase.identifier}
              />
            );
          })}
        </div>
      </section>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(Timeline);