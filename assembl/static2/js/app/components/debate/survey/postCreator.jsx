// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';

type Props = {
  isPending: boolean,
  name: string
};

const PostCreator = ({ isPending, name }: Props) => (
  <div className="inline">
    <div className={classnames('user', { pending: isPending })}>
      <span className="assembl-icon-profil grey">&nbsp;</span>
      {isPending ? <Translate value="debate.postAwaitingModeration" /> : <span className="username">{name}</span>}
    </div>
  </div>
);

export default PostCreator;