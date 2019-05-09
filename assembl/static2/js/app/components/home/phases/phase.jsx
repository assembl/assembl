import React from 'react';
import { compose } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate, Localize } from 'react-redux-i18n';

import { get } from '../../../utils/routeMap';
import { getPhaseStatus, isSeveralIdentifiers } from '../../../utils/timeline';
import { displayModal } from '../../../utils/utilityManager';
import { browserHistory } from '../../../router';
import { withScreenWidth } from '../../common/screenDimensions';
import { isMobileSizedScreen, isTabletSizedScreen } from '../../../utils/globalFunctions';

const BOX_TOP_MARGIN = {
  mobile: {
    maxTopMargin: 0,
    marginStep: 0,
    phasesPerLine: 1
  },
  tablet: {
    maxTopMargin: 20,
    marginStep: 0,
    phasesPerLine: 2
  },
  desktop: {
    maxTopMargin: 30,
    marginStep: 10,
    phasesPerLine: 4
  }
};

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
    const { imgUrl, startDate, title, description, index, screenWidth } = this.props;
    const stepNumber = index + 1;
    const backgroundImage = imgUrl ? `url(${imgUrl})` : null;

    const computeBoxTopMargin = (marginSettings) => {
      const { maxTopMargin, marginStep, phasesPerLine } = marginSettings;
      return maxTopMargin - (index % phasesPerLine) * marginStep;
    };

    // Return top margin value according to the screenwidth
    const boxTopMargin = () => {
      if (isMobileSizedScreen(screenWidth)) {
        return computeBoxTopMargin(BOX_TOP_MARGIN.mobile);
      } else if (isTabletSizedScreen(screenWidth)) {
        return computeBoxTopMargin(BOX_TOP_MARGIN.tablet);
      }
      return computeBoxTopMargin(BOX_TOP_MARGIN.desktop);
    };

    return (
      <div className="illustration-box" style={{ backgroundImage: backgroundImage, marginTop: `${boxTopMargin()}px` }}>
        <div onClick={this.displayPhase} className="content-box">
          {stepNumber && <h1 className="timeline-box-number">{stepNumber}</h1>}
          {title && <h3 className="light-title-3">{title}</h3>}
          {startDate && <h4 className="light-title-4">{<Localize value={startDate} dateFormat="date.format2" />}</h4>}
          {description && <div className="description-box">{description}</div>}
          <div className="box-hyphen visible-lg">&nbsp;</div>
          <div className="box-hyphen rotate-hyphen visible-lg">&nbsp;</div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  i18n: state.i18n,
  debate: state.debate,
  timeline: state.timeline
});

export default compose(connect(mapStateToProps), withScreenWidth)(Phase);