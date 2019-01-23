// @flow
import React, { Component, Fragment } from 'react';
import { Col } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';

// Component imports
import Loader, { LOADER_TYPE } from '../../components/common/loader/loader';
import ToolbarSlider from '../../components/common/toolbarSlider/toolbarSlider';
import TitleWithTooltip from '../../components/common/titleWithTooltip/titleWithTooltip';
import ResponsiveWordCloud from '../../components/common/wordCloud/responsiveWordCloud';
import KeywordInfo from '../../components/common/keywordInfo/keywordInfo';
import SentimentBar from '../../components/common/sentimentBar/sentimentBar';
import WordCountInformation from '../../components/common/wordCountInformation/wordCountInformation';
import Description from '../../components/common/description/description';
import Title from '../../components/common/title/title';

// Type imports
import type { Keyword } from './dataType'; // TODO: move somewhere else

import fakeData from './data.json'; // TODO: to delete

type Props = {};

export type State = {
  keywordsColor: string,
  keywordSelected: boolean,
  keywordData: Keyword,
  numberOfKeywordsToDisplay: number,
  loading: boolean,
  errorLoading: boolean
};

class SemanticAnalysis extends Component<Props, State> {
  state = {
    keywordsColor: '84, 4, 215', // #BLUE_VIOLET
    keywordSelected: false,
    keywordData: {
      text: 'Pas de mot sélectionné',
      count: 0,
      relevance: 0
    },
    numberOfKeywordsToDisplay: this.NUM_WORDS_DEFAULT,
    loading: true,
    errorLoading: false
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
    const { keywordsColor, keywordData, numberOfKeywordsToDisplay, loading, errorLoading } = this.state;

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
    const informationKeywordTitle: string = I18n.t(informationKeywordKey);
    const keywordCloudTitle: string = I18n.t(keywordCloudKey);
    const keywordCloudDefinition: string = I18n.t(keywordCloudDefinitionKey);
    const numberKeywordTitle: string = I18n.t(numberKeywordKey);
    const occurenceTitle: string = I18n.t(occurenceKey);
    const occurenceDefinition: string = I18n.t(occurenceDefinitionKey);
    const relevanceTitle: string = I18n.t(relevanceKey);
    const relevanceDefinition: string = I18n.t(relevanceDefinitionKey);
    const sentimentAnalysisTitle: string = I18n.t(sentimentAnalysisKey);
    const sentimentAnalysisDefinition: string = I18n.t(sentimentAnalysisDefinitionKey);

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

    return loading || errorLoading ? (
      <Fragment>
        {/** Loading section */}
        <Col xs={12} className="no-padding">
          <Loader type={errorLoading ? LOADER_TYPE.ERROR : LOADER_TYPE.LOADING} />
        </Col>
      </Fragment>
    ) : (
      <Fragment>
        {/** Description section */}
        <Col xs={12} className="no-padding">
          <Title level={1}>{keywordCloudTitle}</Title>
          <Description>
            <p>{keywordCloudDefinition}</p>
          </Description>
          <WordCountInformation wordCount={23302} className="padding-bottom" />
        </Col>

        {/** WordCloud section */}
        <Col xs={12} md={8} className="no-padding lg-wordcloud-padding margin-s">
          <ResponsiveWordCloud
            keywordsColor={keywordsColor}
            numberOfKeywordsToDisplay={numberOfKeywordsToDisplay}
            onWordClick={this.onKeywordClickHandler}
            onMouseOverWord={this.onKeywordOverHandler}
            onMouseOutWord={this.onKeywordOutHandler}
            keywords={fakeData.keywords}
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
              maxValue={fakeData.keywords.length}
              minValue={this.MIN_WORDS}
              defaultValue={this.NUM_WORDS_DEFAULT}
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
      </Fragment>
    );
  }
}

export default SemanticAnalysis;