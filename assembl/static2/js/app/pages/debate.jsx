import React from 'react';
import { connect } from 'react-redux';
import { isDateExpired } from '../utils/globalFunctions';
import Themes from '../components/debate/common/themes';
import Timeline from '../components/debate/navigation/timeline';

class Debate extends React.Component {
  getCurrentStepIdentifier() {
    const currentDate = new Date();
    const { debateData } = this.props.debate;
    let identifier = null;
    if (debateData.timeline) {
      debateData.timeline.map((phase) => {
        const startDate = new Date(phase.start);
        const endDate = new Date(phase.end);
        if (isDateExpired(currentDate, startDate) && isDateExpired(endDate, currentDate)) {
          identifier = phase.identifier;
        }
        return identifier;
      });
    }
    return identifier || 'thread';
  }
  render() {
    const currentIdentifier = this.getCurrentStepIdentifier();
    const isParentRoute = this.props.location.pathname.split('debate')[1].length === 0;
    const queryPhase = this.props.location.query.phase;
    return (
      <div className="debate">
        <Timeline />
        {isParentRoute &&
          <Themes identifier={currentIdentifier} queryPhase={queryPhase} />
        }
        {!isParentRoute && this.props.children}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(Debate);