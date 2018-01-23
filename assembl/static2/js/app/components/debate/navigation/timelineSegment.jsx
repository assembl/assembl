import React from 'react';
import { browserHistory } from 'react-router';
import { Translate, Localize, I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { get } from '../../../utils/routeMap';
import { displayModal } from '../../../utils/utilityManager';
import { getPhaseStatus, isSeveralIdentifiers } from '../../../utils/timeline';
import ThematicsTable from './thematicsTable';

class TimelineSegment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false
    };
  }

  showMenu = () => {
    const { onMouseOver, thematic } = this.props;
    this.setState({ active: true }, () => {
      if (onMouseOver) onMouseOver(thematic.id);
    });
  };

  hideMenu = () => {
    const { onMouseLeave, thematic } = this.props;
    this.setState({ active: false }, () => {
      if (onMouseLeave) onMouseLeave(thematic.id);
    });
  };

  displayPhase = () => {
    const { locale } = this.props.i18n;
    const { phaseIdentifier, title, startDate, endDate } = this.props;
    const { debateData } = this.props.debate;
    const phase = debateData.timeline.filter(p => p.identifier === phaseIdentifier);
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
  };

  render() {
    const { barPercent, title, locale, phaseIdentifier } = this.props;
    const { active } = this.state;
    const timelineClass = 'timeline-title txt-active-light';
    return (
      <div
        className={classNames('minimized-timeline', {
          active: active
        })}
        onMouseOver={this.showMenu}
        onMouseLeave={this.hideMenu}
      >
        {title.entries.filter(entry => locale === entry['@language']).map((entry, index) => (
          <div onClick={this.displayPhase} className={timelineClass} key={index}>
            <div className="timeline-link">{entry.value}</div>
          </div>
        ))}
        <div className="timeline-graph">
          <div className="timeline-bars">
            {barPercent > 0 && (
              <div className="timeline-bar-filler" style={barPercent < 20 ? { width: '20%' } : { width: `${barPercent}%` }}>
                &nbsp;
              </div>
            )}
            <div className="timeline-bar-background">&nbsp;</div>
          </div>
        </div>
        <span className="timeline-arrow" />
        {active && (
          <div className="thematics-container">
            <ThematicsTable identifier={phaseIdentifier} />
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  i18n: state.i18n,
  debate: state.debate
});

export default connect(mapStateToProps)(TimelineSegment);