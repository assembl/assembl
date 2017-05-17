import React from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { Translate, Localize } from 'react-redux-i18n';
import { get } from '../../../utils/routeMap';
import { isPhaseStarted, getStartDatePhase, getPhaseName, getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import { displayModal } from '../../../utils/utilityManager';

class Step extends React.Component {
  constructor(props) {
    super(props);
    this.displayPhase = this.displayPhase.bind(this);
  }
  displayPhase() {
    const { identifier } = this.props;
    const { debateData } = this.props.debate;
    const { locale } = this.props.i18n;
    const { isRedirectionToV1 } = this.props.phase;
    const slug = { slug: debateData.slug };
    const phaseStarted = isPhaseStarted(debateData.timeline, identifier);
    const phaseName = getPhaseName(debateData.timeline, identifier, locale).toLowerCase();
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, identifier);
    if (phaseStarted) {
      // This redirection should be removed when the phase 2 will be done
      if (isRedirectionToV1 && !isPhaseCompleted) {
        const body = <Translate value="redirectToV1" phaseName={phaseName} />;
        displayModal(null, body, true, null, null, true);
        setTimeout(() => {
          window.location = `${get('oldDebate', slug)}`;
        }, 6000);
      } else {
        browserHistory.push(`${get('debate', slug)}?phase=${identifier}`);
      }
    } else {
      const startDate = getStartDatePhase(debateData.timeline, identifier);
      const body = <div><Translate value="debate.notStarted" phaseName={phaseName} /><Localize value={startDate} dateFormat="date.format" /></div>;
      displayModal(null, body, true, null, null, true);
    }
  }
  render() {
    const { locale } = this.props.i18n;
    const { imgUrl, startDate, title, description, index } = this.props;
    const stepNumber = index + 1;
    return (
      <div className="illustration-box">
        <div className="image-box" style={{ backgroundImage: `url(${imgUrl})` }}>&nbsp;</div>
        <div onClick={this.displayPhase} className="content-box">
          <h1 className="light-title-1">{stepNumber}</h1>
          {title &&
            <h3 className="light-title-3">
              {title.entries.map((entry, index2) => {
                return (
                  <span key={index2}>{locale === entry['@language'] ? entry.value : ''}</span>
                );
              })}
            </h3>
          }
          <h4 className="light-title-4">
            <Localize value={startDate} dateFormat="date.format2" />
          </h4>
          {description &&
            <div className="text-box">
              {description.entries.map((entry, index3) => {
                return (
                  <span key={index3}>{locale === entry['@language'] ? entry.value : ''}</span>
                );
              })}
            </div>
          }
        </div>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n,
    debate: state.debate,
    phase: state.phase
  };
};

export default connect(mapStateToProps)(Step);