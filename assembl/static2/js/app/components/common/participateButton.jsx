// @flow

import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { getIsDebateStarted } from '../../utils/timeline';

type participateButtonProps = {
  displayPhase: Function,
  timeline: Timeline,
  btnClass: string
};

export const participateButton = ({ displayPhase, timeline, btnClass }: participateButtonProps) => (
  <div>
    {getIsDebateStarted(timeline) ? (
      <Button onClick={displayPhase} className={`button-submit button-${btnClass}`}>
        <Translate value="home.accessButton" />
      </Button>
    ) : null}
  </div>
);

export default participateButton;