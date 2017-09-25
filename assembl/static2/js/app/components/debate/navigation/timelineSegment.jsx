import React from 'react';
import { browserHistory } from 'react-router';
import { Translate, Localize, I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { get } from '../../../utils/routeMap';
import { displayModal } from '../../../utils/utilityManager';
import { getPhaseStatus, isSeveralIdentifiers } from '../../../utils/timeline';

class TimelineSegment extends React.Component {
  constructor(props) {
    super(props);
    this.displayPhase = this.displayPhase.bind(this);
  }
  displayPhase() {
    const { locale } = this.props.i18n;
    const { phaseIdentifier, title, startDate, endDate } = this.props;
    const { debateData } = this.props.debate;
    const phase = debateData.timeline.filter((p) => {
      return p.identifier === phaseIdentifier;
    });
    const isRedirectionToV1 = phase[0].interface_v1;
    const slug = { slug: debateData.slug };
    const params = { slug: debateData.slug, phase: phaseIdentifier };
    let phaseName = '';
    title.entries.forEach((entry) => {
      if (locale === entry['@language']) {
        phaseName = entry.value.toLowerCase();
      }
    });
    const isSeveralPhases = isSeveralIdentifiers(debateData.timeline);
    const phaseStatus = getPhaseStatus(startDate, endDate);
    if (isSeveralPhases) {
      if (phaseStatus === 'notStarted') {
        const body = (
          <div>
            <Translate value="debate.notStarted" phaseName={phaseName} />
            <Localize value={startDate} dateFormat="date.format" />
          </div>
        );
        displayModal(null, body, true, null, null, true);
      }
      if (phaseStatus === 'inProgress' || phaseStatus === 'completed') {
        if (!isRedirectionToV1) {
          browserHistory.push(get('debate', params));
        } else {
          const body = <Translate value="redirectToV1" phaseName={phaseName} />;
          const button = { link: get('oldDebate', slug), label: I18n.t('home.accessButton'), internalLink: false };
          displayModal(null, body, true, null, button, true);
          setTimeout(() => {
            window.location = get('oldDebate', slug);
          }, 6000);
        }
      }
    } else if (!isRedirectionToV1) {
      browserHistory.push(get('debate', params));
    } else {
      window.location = get('oldDebate', slug);
    }
  }
  render() {
    const { index, barWidth, isCurrentPhase, isStepCompleted, title, locale } = this.props;
    const timelineClass = () => {
      if (isCurrentPhase) {
        return 'txt-active-bold';
      } else if (isStepCompleted) {
        return 'txt-active';
      }
      return 'txt-not-active';
    };
    return (
      <div className="minimized-timeline" style={{ marginLeft: `${index * 100}px` }}>
        {title.entries
          .filter((entry) => {
            return locale === entry['@language'];
          })
          .map((entry, index2) => {
            return (
              <div onClick={this.displayPhase} className={`timeline-title ${timelineClass()}`} key={index2}>
                <div className="timeline-link">
                  {entry.value}
                </div>
              </div>
            );
          })}
        <div className={isStepCompleted || isCurrentPhase ? 'timeline-number active' : 'timeline-number not-active'}>
          {isStepCompleted
            ? <span className="assembl-icon-checked white" />
            : <span>
              {index + 1}
            </span>}
        </div>
        <div className="timeline-bar-2" style={{ width: `${barWidth}px` }}>
          &nbsp;
        </div>
        <div className="timeline-bar-1">&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n,
    debate: state.debate
  };
};

export default connect(mapStateToProps)(TimelineSegment);