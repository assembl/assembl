// @flow
import * as React from 'react';

import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import DontUnderstand from '../../svg/dontUnderstand';
import MoreInfo from '../../svg/moreInfo';
import { likeTooltip, disagreeTooltip, dontUnderstandTooltip, moreInfoTooltip } from '../../common/tooltips';

export type SentimentDefinition = {
  type: SentimentTypes,
  camelType: string,
  color: string,
  tooltip: React.Node,
  SvgComponent: React.ComponentType<any>
};

const sentimentDefinitions: Array<SentimentDefinition> = [
  {
    type: 'LIKE',
    camelType: 'like',
    color: '#46D081',
    tooltip: likeTooltip,
    SvgComponent: Like
  },
  {
    type: 'DISAGREE',
    camelType: 'disagree',
    color: '#F2474D',
    tooltip: disagreeTooltip,
    SvgComponent: Disagree
  },
  {
    type: 'DONT_UNDERSTAND',
    camelType: 'dontUnderstand',
    color: '#FAC16F',
    tooltip: dontUnderstandTooltip,
    SvgComponent: DontUnderstand
  },
  {
    type: 'MORE_INFO',
    camelType: 'moreInfo',
    color: '#9374FF',
    tooltip: moreInfoTooltip,
    SvgComponent: MoreInfo
  }
];

type SentimentDefinitionsObject = {
  [string]: SentimentDefinition
};

export default sentimentDefinitions;

export const sentimentDefinitionsObject: SentimentDefinitionsObject = sentimentDefinitions.reduce((result, sentiment) => {
  Object.assign(result, { [sentiment.camelType]: sentiment });
  return result;
}, {});