// @flow
import React from 'react';

type Props = {
  title: string
};

const ModuleBlock = ({ title }: Props) => <div className="module-block">{title}</div>;

export default ModuleBlock;