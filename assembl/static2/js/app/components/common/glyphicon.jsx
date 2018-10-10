// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';

type Props = {
  glyph: string,
  color: string,
  size: number,
  desc: string
};

const Glyphicon = ({ glyph, color, size, desc }: Props) => (
  <img
    width={`${size}px`}
    height={`${size}px`}
    src={`/static2/img/icons/${color}/${glyph}.svg`}
    alt={I18n.t(desc)}
    title={I18n.t(desc)}
  />
);

export default Glyphicon;