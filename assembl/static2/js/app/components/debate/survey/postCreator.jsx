// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  isModerating: boolean,
  name: string
};

const PostCreator = ({ isModerating, name }: Props) => (
  <div className="inline">
    <div className="user">
      <span className="assembl-icon-profil grey">&nbsp;</span>
      {isModerating ? <Translate value="debate.postAwaitingModeration" /> : <span className="username">{name}</span>}
    </div>
  </div>
);

export default PostCreator;