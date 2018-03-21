// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = { count: number };

const ParticipantsCount = ({ count }: Props) => {
  let msgid;

  if (count === 0) {
    msgid = 'debate.voteSession.participantsCount_0';
  } else if (count === 1) {
    msgid = 'debate.voteSession.participantsCount_1';
  } else {
    msgid = 'debate.voteSession.participantsCount_several';
  }

  return (
    <div className="participants-count box center">
      <div className="assembl-icon-profil black" />
      <div className="margin-m">
        <Translate value={msgid} count={count} />
      </div>
    </div>
  );
};

export default ParticipantsCount;