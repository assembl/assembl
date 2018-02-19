// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = { count: number };

const ParticipantsCount = ({ count }: Props) => (
  <div className="participants-count box background-grey center">
    <div className="assembl-icon-profil black" />
    <Translate value="debate.voteSession.participantsCount" count={count} />
  </div>
);

export default ParticipantsCount;