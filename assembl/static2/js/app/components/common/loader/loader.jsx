// @flow
import React from 'react';

export const LOADER_TYPE = {
  LOADING: 'LOADING'
};

// type LoaderType = {
//   imgSrc: string,
//   imgAlt: string,
//   children: string
// };

export type Props = {
  type: $Keys<typeof LOADER_TYPE>
};

const Loader = ({ type }: Props) => {
  // const { imgSrc, imgAlt, children } = LOADER_TYPE.loading;
  const description = type === LOADER_TYPE.LOADING ? 'aaa' : 'bbb';
  return (
    <React.Fragment>
      <img src="aaa" alt="aaa" />
      <p>{description}</p>
    </React.Fragment>
  );
};

export default Loader;