// @flow
import React, { Component } from 'react';
import { Col } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';

// HOC imports
import manageColor from '../../../components/common/manageColor';

// Component imports
import ToolbarSlider from '../../../components/common/toolbarSlider/toolbarSlider';
import TitleWithTooltip from '../../../components/common/titleWithTooltip/titleWithTooltip';
import ResponsiveWordCloud from '../../../components/common/wordCloud/responsiveWordCloud';
import KeywordInfo from '../../../components/common/keywordInfo/keywordInfo';
import SentimentBar from '../../../components/common/sentimentBar/sentimentBar';
import WordCountInformation from '../../../components/common/wordCountInformation/wordCountInformation';
import Description from '../../../components/common/description/description';
import Title from '../../../components/common/title/title';

// Type imports
import type { Keyword } from '../dataType';

import fakeData from '../data.json';

export type Props = {
  /** Optional first color */
  firstColor: string,
  /** Optional second color */
  secondColor: string
};

export type State = {
  keywordSelected: boolean,
  keywordData: Keyword,
  numberOfKeywordsToDisplay: number
};

const rgbToHex = (color) => {
  let hex = Number(color).toString(16);
  if (hex.length < 2) {
    hex = `0${hex}`;
  }
  return hex;
};

const fullRgbToHex = (color) => {
  const rgbArray = color.substring(4, color.length - 1).split(', ');
  return `#${rgbToHex(rgbArray[0])}${rgbToHex(rgbArray[1])}${rgbToHex(rgbArray[2])}`;
};

export class SemanticAnalysis extends Component<Props, State> {
  static defaultProps = {
    firstColor: 'rgb(0, 0, 0)',
    secondColor: 'rgb(0, 0, 0)'
  };

  state = {
    keywordSelected: false,
    keywordData: {
      text: 'Pas de mot sélectionné',
      count: 0,
      relevance: 0
    },
    numberOfKeywordsToDisplay: this.NUM_WORDS_DEFAULT
  };

  NUM_WORDS_DEFAULT = 20;

  MIN_WORDS = 10;

  onNumberOfKeywordSliderChangeHandler = (value: number) => {
    this.setState({ numberOfKeywordsToDisplay: value });
  };

  onKeywordClickHandler = (newKeywordData: Keyword) => {
    const { keywordData, keywordSelected } = this.state;
    if (keywordData === newKeywordData) {
      this.setState({ keywordSelected: !keywordSelected });
    } else {
      this.setState({ keywordData: newKeywordData });
    }
  };

  onKeywordOverHandler = (newKeywordData: Keyword) => {
    const { keywordSelected } = this.state;
    if (!keywordSelected) {
      this.setState({ keywordData: newKeywordData });
    }
  };

  onKeywordOutHandler = () => {
    const { keywordSelected } = this.state;
    if (!keywordSelected) {
      this.setState({
        keywordData: {
          text: 'Pas de mot sélectionné',
          count: 0,
          relevance: 0
        }
      });
    }
  };

  render() {
    const { keywordData, numberOfKeywordsToDisplay } = this.state;
    const { firstColor, secondColor } = this.props;

    // Translation keys
    const informationKeywordKey = 'debate.semanticAnalysis.informationKeyword';
    const keywordCloudKey = 'debate.semanticAnalysis.keywordCloud';
    const keywordCloudDefinitionKey = 'debate.semanticAnalysis.keywordCloudDefinition';
    const numberKeywordKey = 'debate.semanticAnalysis.numberKeyword';
    const occurenceKey = 'debate.semanticAnalysis.occurence';
    const occurenceDefinitionKey = 'debate.semanticAnalysis.occurenceDefinition';
    const relevanceKey = 'debate.semanticAnalysis.relevance';
    const relevanceDefinitionKey = 'debate.semanticAnalysis.relevanceDefinition';
    const sentimentAnalysisKey = 'debate.semanticAnalysis.sentimentAnalysis';
    const sentimentAnalysisDefinitionKey = 'debate.semanticAnalysis.sentimentAnalysisDefinition';

    // Title contents
    const informationKeywordTitle = I18n.t(informationKeywordKey);
    const keywordCloudTitle = I18n.t(keywordCloudKey);
    const keywordCloudDefinition = I18n.t(keywordCloudDefinitionKey);
    const numberKeywordTitle = I18n.t(numberKeywordKey);
    const occurenceTitle = I18n.t(occurenceKey);
    const occurenceDefinition = I18n.t(occurenceDefinitionKey);
    const relevanceTitle = I18n.t(relevanceKey);
    const relevanceDefinition = I18n.t(relevanceDefinitionKey);
    const sentimentAnalysisTitle = I18n.t(sentimentAnalysisKey);
    const sentimentAnalysisDefinition = I18n.t(sentimentAnalysisDefinitionKey);

    const sentimentScore = (fakeData.sentiment.document.score + 1) / 2;
    const informationKeywordTooltip = (
      <div>
        <p>
          <strong>{occurenceTitle}:</strong> {occurenceDefinition}
        </p>
        <p>
          <strong>{relevanceTitle}:</strong> {relevanceDefinition}
        </p>
      </div>
    );

    const sentimentAnalysisTooltip = (
      <div>
        <p>{sentimentAnalysisDefinition}</p>
      </div>
    );

    return (
      <div className="semantic-analysis">
        {/** Description section */}
        <Col xs={12} className="no-padding">
          <Title level={1}>{keywordCloudTitle}</Title>
          <Description>
            <p>{keywordCloudDefinition}</p>
          </Description>
          <WordCountInformation wordCount={23302} className="padding-bottom" />
        </Col>

        {/** WordCloud section */}
        <Col xs={12} md={8} className="no-padding lg-wordcloud-padding margin-m">
          <ResponsiveWordCloud
            keywordsColor={firstColor}
            keywordsColorActive={secondColor}
            keywords={fakeData.keywords}
            numberOfKeywordsToDisplay={numberOfKeywordsToDisplay}
            onWordClick={this.onKeywordClickHandler}
            onMouseOverWord={this.onKeywordOverHandler}
            onMouseOutWord={this.onKeywordOutHandler}
          />
        </Col>

        {/** Toolbar section */}
        <Col xs={12} md={4} className="no-padding margin-s">
          <Col xsHidden sm={6} md={12} className="no-padding">
            <TitleWithTooltip level={2} tooltipContent={informationKeywordTooltip}>
              {informationKeywordTitle}
            </TitleWithTooltip>

            <KeywordInfo keyword={keywordData} />
          </Col>

          <Col xsHidden smHidden md={12} className="no-padding">
            <Title level={2}>{numberKeywordTitle}</Title>

            <ToolbarSlider
              color={fullRgbToHex(firstColor)}
              defaultValue={this.NUM_WORDS_DEFAULT}
              maxValue={fakeData.keywords.length}
              minValue={this.MIN_WORDS}
              onSliderChange={this.onNumberOfKeywordSliderChangeHandler}
            />
          </Col>

          <Col xs={12} sm={6} md={12} className="no-padding">
            <TitleWithTooltip level={2} tooltipContent={sentimentAnalysisTooltip}>
              {sentimentAnalysisTitle}
            </TitleWithTooltip>

            <SentimentBar value={sentimentScore} />
          </Col>
        </Col>
      </div>
    );
  }
}

export default manageColor(SemanticAnalysis);