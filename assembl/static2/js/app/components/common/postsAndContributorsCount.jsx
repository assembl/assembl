import React from 'react';

const PostsAndContributorsCount = ({ vertical, numContributors, numPosts, className = '' }) => {
  const elemClassName = 'counter-with-icon';
  return (
    <div className={`counters ${className}`}>
      <span className={elemClassName}>
        {numPosts} <span className="assembl-icon-message" />
      </span>
      {vertical || ' - '}
      <span className={elemClassName}>
        {numContributors} <span className="assembl-icon-profil" />
      </span>
    </div>
  );
};

export default PostsAndContributorsCount;