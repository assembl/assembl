import React from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { Translate, Localize, I18n } from 'react-redux-i18n';
import { get } from '../../../utils/routeMap';
import { getPhaseStatus, isSeveralIdentifiers } from '../../../utils/timeline';
import { displayModal } from '../../../utils/utilityManager';

class Step extends React.Component {
  constructor(props) {
    super(props);
    this.displayPhase = this.displayPhase.bind(this);
  }
  displayPhase() {
    const { identifier, startDate, title } = this.props;
    const { debateData } = this.props.debate;
    const { locale } = this.props.i18n;
    const slug = { slug: debateData.slug };
    let phaseName = "";
    title.entries.forEach((entry, index2) => {
      if (locale === entry['@language']) {
        phaseName = entry.value.toLowerCase();
      }
    });
    const isSeveralPhases = isSeveralIdentifiers(debateData.timeline);
    const phaseStatus = getPhaseStatus(debateData.timeline, identifier);
    if (isSeveralPhases) {
      if (phaseStatus === 'notStarted') {
        const body = <div><Translate value="debate.notStarted" phaseName={phaseName} /><Localize value={startDate} dateFormat="date.format" /></div>;
        displayModal(null, body, true, null, null, true);
      }
      if (phaseStatus === 'inProgress' || phaseStatus === 'completed') {
        if (identifier === 'survey') {
          browserHistory.push(`${get('debate', slug)}?phase=${identifier}`);
        } else {
          const body = <Translate value="redirectToV1" phaseName={phaseName} />;
          const button = { link: `${get('oldDebate', slug)}`, label: I18n.t('home.accessButton'), internalLink: false };
          displayModal(null, body, true, null, button, true);
          setTimeout(() => {
            window.location = `${get('oldDebate', slug)}`;
          }, 6000);
        }
      }
    } else {
      if (identifier === 'survey') {
        browserHistory.push(`${get('debate', slug)}?phase=${identifier}`);
      } else {
        window.location = `${get('oldDebate', slug)}`;
      }
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
    debate: state.debate
  };
};

export default connect(mapStateToProps)(Step);