import React from 'react';
import { connect } from 'react-redux';
import { Translate, Localize } from 'react-redux-i18n';

import { get } from '../../../utils/routeMap';
import { getPhaseStatus, isSeveralIdentifiers } from '../../../utils/timeline';
import { displayModal } from '../../../utils/utilityManager';
import { browserHistory } from '../../../router';

class Phase extends React.Component {
  constructor(props) {
    super(props);
    this.displayPhase = this.displayPhase.bind(this);
  }

  displayPhase() {
    const { identifier, startDate, endDate, title, timeline } = this.props;
    const { debateData } = this.props.debate;
    const params = { slug: debateData.slug, phase: identifier };
    const isSeveralPhases = isSeveralIdentifiers(timeline);
    const phaseStatus = getPhaseStatus(startDate, endDate);
    if (isSeveralPhases) {
      if (phaseStatus === 'notStarted') {
        const body = (
          <div>
            <Translate value="debate.notStarted" phaseName={title} />
            {startDate && <Localize value={startDate} dateFormat="date.format" />}
          </div>
        );
        displayModal(null, body, true, null, null, true);
      }
      if (phaseStatus === 'inProgress' || phaseStatus === 'completed') {
        browserHistory.push(get('debate', params));
      }
    } else {
      browserHistory.push(get('debate', params));
    }
  }

  render() {
    const { imgUrl, startDate, title, description, index } = this.props;
    const stepNumber = index + 1;
    return (
      <div className="illustration-box">
        <div className="image-box" style={imgUrl ? { backgroundImage: `url(${imgUrl})` } : null} />
        <div onClick={this.displayPhase} className="content-box">
          <h1 className="timeline-box-number">{stepNumber}</h1>
          {title && <h3 className="light-title-3">{title}</h3>}
          <h4 className="light-title-4">{startDate && <Localize value={startDate} dateFormat="date.format2" />}</h4>
          {description && <div className="description-box">{description}</div>}
        </div>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen hidden-xs">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen hidden-xs">&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  i18n: state.i18n,
  debate: state.debate,
  timeline: state.timeline
});

export default connect(mapStateToProps)(Phase);