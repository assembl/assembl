// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Tooltip } from 'react-bootstrap';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import Doughnut from '../../svg/doughnut';
import { openShareModal, promptForLoginOr, displayModal } from '../../../utils/utilityManager';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';

type Props = {
  routerParams: Map<string>,
  ideaId: string,
  useSocialMedia: boolean,
  timeline: Array<Object>,
  identifier: string
};

const createTooltip = (category, count, color) => (
  <Tooltip id={`${category}-tooltip`} className="no-arrow-tooltip sentiment-header-tooltip" style={{ backgroundColor: color }}>
    <Translate value={`debate.${category}Count`} count={count} />
  </Tooltip>
);

// TODO replace by the query
const elements = [
  {
    color: '#46d38d',
    count: 12,
    Tooltip: createTooltip('agree', 12, '#46d38d')
  },
  {
    color: '#f75959',
    count: 27,
    Tooltip: createTooltip('disagree', 27, '#f75959')
  }
];

const totalCount = elements.reduce((result, element) => result + element.count, 0);

const voteOnThematic = () => {
  // TODO add themutation here
};

const headerActions = ({ routerParams, ideaId, useSocialMedia, timeline, identifier }: Props) => {
  const handleClick = () => {
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(timeline, identifier);
    if (isPhaseCompleted) {
      const body = (
        <div>
          <Translate value="debate.isCompleted" />
        </div>
      );
      displayModal(null, body, true, null, null, true);
    } else {
      promptForLoginOr(voteOnThematic)();
    }
  };
  const modalTitle = <Translate value="debate.shareThematic" />;
  return (
    <div className="header-actions-container">
      <div
        className="share-button action-button"
        onClick={() =>
          openShareModal({
            title: modalTitle,
            routerParams: routerParams,
            elementId: ideaId,
            social: useSocialMedia
          })
        }
      >
        <div className="share-icon-container white">
          <span className="assembl-icon-share" />
        </div>
        <div className="action-button-label">
          <Translate value="debate.share" />
        </div>
      </div>
      <div
        className="like-button action-button"
        onClick={() => {
          handleClick();
        }}
      >
        <Like size={30} color="#ffffff" backgroundColor="none" />
        <div className="action-button-label">
          <Translate value="debate.agree" />
        </div>
      </div>
      <div
        className="disagree-button action-button"
        onClick={() => {
          handleClick();
        }}
      >
        <Disagree size={30} color="#ffffff" backgroundColor="none" />
        <div className="action-button-label">
          <Translate value="debate.disagree" />
        </div>
      </div>
      <div className="doughnut-container">
        <Doughnut elements={elements} />
        <div className="total-count-container">
          <div className="total-count">{totalCount}</div>
          <div className="count-label">
            {totalCount > 1 ? <Translate value="debate.votes" /> : <Translate value="debate.vote" />}
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = ({ debate }) => {
  const { debateData } = debate;
  return {
    useSocialMedia: debateData.useSocialMedia,
    timeline: debateData.timeline
  };
};

export default connect(mapStateToProps)(headerActions);