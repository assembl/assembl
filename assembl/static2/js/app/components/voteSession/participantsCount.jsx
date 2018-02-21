// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = { count: number };

const ParticipantsCount = ({ count }: Props) => (
  <div className="participants-count box center">
    <div className="assembl-icon-profil black" />
    <div className="margin-m">
      <Translate value="debate.voteSession.participantsCount" count={count} />
    </div>
  </div>
);

export default ParticipantsCount;