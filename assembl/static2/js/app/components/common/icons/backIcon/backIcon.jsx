// @flow
import React from 'react';
import classNames from 'classnames';

type Props = {
  className: ?string
};

const BackIcon = ({ className }: Props) => (
  <svg
    className={classNames(className, 'backIcon')}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="13"
    viewBox="0 0 16 13"
  >
    <g fill="none" fillRule="evenodd" transform="translate(-3 -5)">
      <circle cx="11" cy="11" r="11" fill="none" />
      <path strokeLinecap="round" strokeLinejoin="bevel" strokeWidth="1.25" d="M4.915 11.479H17.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M9 17l-5-5.5L9 6" />
    </g>
  </svg>
);

BackIcon.defaultProps = {
  className: 'blackIcon'
};

export default BackIcon;