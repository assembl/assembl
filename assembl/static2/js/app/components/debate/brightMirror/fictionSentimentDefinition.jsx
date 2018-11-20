// @flow
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import DontUnderstand from '../../svg/dontUnderstand';
import MoreInfo from '../../svg/moreInfo';
import {
  fictionLikeTooltip,
  fictionDislikeTooltip,
  fictionDontUnderstandTooltip,
  fictionMoreInfoTooltip
} from '../../common/tooltips';
import { type SentimentDefinition } from '../common/sentimentDefinitions';

const fictionSentimentDefinitions: Array<SentimentDefinition> = [
  {
    type: 'LIKE',
    camelType: 'like',
    color: '#46D081',
    tooltip: fictionLikeTooltip,
    SvgComponent: Like
  },
  {
    type: 'DISAGREE',
    camelType: 'disagree',
    color: '#F2474D',
    tooltip: fictionDislikeTooltip,
    SvgComponent: Disagree
  },
  {
    type: 'DONT_UNDERSTAND',
    camelType: 'dontUnderstand',
    color: '#FAC16F',
    tooltip: fictionDontUnderstandTooltip,
    SvgComponent: DontUnderstand
  },
  {
    type: 'MORE_INFO',
    camelType: 'moreInfo',
    color: '#9374FF',
    tooltip: fictionMoreInfoTooltip,
    SvgComponent: MoreInfo
  }
];

export default fictionSentimentDefinitions;