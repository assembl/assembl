// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';

import { getIconPath } from '../../utils/globalFunctions';

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
    src={getIconPath(`${glyph}.svg`, color)}
    alt={I18n.t(desc)}
    title={I18n.t(desc)}
  />
);

export default Glyphicon;