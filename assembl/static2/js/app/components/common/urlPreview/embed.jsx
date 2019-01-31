// @flow
import * as React from 'react';
import { getURLComponent } from '../../../utils/urlPreview';

type EmbedProps = {
  url: string,
  defaultEmbed: React.Element<'iframe' | 'div'> | null
};

const Embed = ({ url, defaultEmbed }: EmbedProps) => getURLComponent(url) || defaultEmbed;

Embed.defaultProps = {
  defaultEmbed: null
};

export default Embed;