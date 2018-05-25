// @flow
import { getURLComponent } from '../../../utils/urlPreview';

type EmbedProps = {
  url: string,
  defaultEmbed: *
};

const Embed = ({ url, defaultEmbed }: EmbedProps) => {
  const component = getURLComponent(url);
  return component || defaultEmbed;
};

export default Embed;