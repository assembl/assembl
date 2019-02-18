// @flow

import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { getIsDebateStarted } from '../../utils/timeline';

type Props = {
  displayPhase: Function,
  timeline: Timeline,
  btnClass: string,
  btnLabel?: ?string
};

const ParticipateButton = ({ displayPhase, timeline, btnLabel, btnClass }: Props) => (
  <div>
    {getIsDebateStarted(timeline) ? (
      <Button onClick={displayPhase} className={`button-submit button-${btnClass}`}>
        {btnLabel ? <span>{btnLabel}</span> : <Translate value="home.accessButton" />}
      </Button>
    ) : null}
  </div>
);

ParticipateButton.defaultProps = {
  btnLabel: null
};

export default ParticipateButton;