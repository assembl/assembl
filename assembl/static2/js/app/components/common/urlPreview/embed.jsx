// @flow
import { getURLComponent } from '../../../utils/urlPreview';

type EmbedProps = {
  url: string,
  defaultEmbed: *
};

const Embed = ({ url, defaultEmbed }: EmbedProps) => getURLComponent(url) || defaultEmbed;

export default Embed;