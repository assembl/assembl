// @flow
import React from 'react';

type SectionTitleProps = {
  title: string,
  annotation: string
};

const SectionTitle = ({ title, annotation }: SectionTitleProps) => (
  <div>
    <h3 className="dark-title-3">{title}</h3>
    <div className="box-hyphen" />
    <div className="annotation">{annotation}</div>
  </div>
);

export default SectionTitle;