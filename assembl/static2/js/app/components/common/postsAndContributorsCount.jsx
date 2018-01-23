import React from 'react';

export const Counter = ({ num, elemClassName = 'counter-with-icon', className = '' }) => (
  <span className={elemClassName}>
    {num} <span className={className} />
  </span>
);

const PostsAndContributorsCount = ({
  vertical,
  numContributors,
  numPosts,
  className = '',
  showNumPosts = true,
  showNumContributors = true
}) => (
  <div className={`counters ${className}`}>
    {showNumPosts && <Counter num={numPosts} className="assembl-icon assembl-icon-message" />}
    {vertical || ' - '}
    {showNumContributors && <Counter num={numContributors} className="assembl-icon assembl-icon-profil" />}
  </div>
);

export default PostsAndContributorsCount;