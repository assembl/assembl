// @flow
import React from 'react';

type Props = {
  name: string
};

const PostCreator = ({ name }: Props) => (
  <div className="inline">
    <div className="user">
      <span className="assembl-icon-profil grey">&nbsp;</span>
      <span className="username">{name}</span>
    </div>
  </div>
);

export default PostCreator;