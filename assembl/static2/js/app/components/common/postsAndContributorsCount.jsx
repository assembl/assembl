// @flow
import React from 'react';

type CounterProps = {
  num: number,
  elemClassName: string,
  className: string
};

type PostsAndContributorsCountProps = {
  vertical: boolean,
  numContributors: number,
  numPosts: number,
  className: string,
  showNumPosts: boolean,
  showNumContributors: boolean
};

export const Counter = ({ num, elemClassName, className }: CounterProps) => (
  <span className={elemClassName}>
    {num} <span className={className} />
  </span>
);

Counter.defaultProps = {
  elemClassName: 'counter-with-icon',
  className: ''
};

const PostsAndContributorsCount = ({
  vertical,
  numContributors,
  numPosts,
  className,
  showNumPosts,
  showNumContributors
}: PostsAndContributorsCountProps) => (
  <div className={`counters ${className}`}>
    {showNumPosts && <Counter num={numPosts} className="assembl-icon assembl-icon-message" />}
    {vertical || ' - '}
    {showNumContributors && <Counter num={numContributors} className="assembl-icon assembl-icon-profil" />}
  </div>
);

PostsAndContributorsCount.defaultProps = {
  className: '',
  vertical: false,
  showNumPosts: true,
  showNumContributors: true
};

export default PostsAndContributorsCount;