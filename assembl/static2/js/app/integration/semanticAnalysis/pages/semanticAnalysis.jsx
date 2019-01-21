// @flow
import React, { Component } from 'react';
import { Grid, Col } from 'react-bootstrap';

// Component imports
import Loader, { LOADER_TYPE } from '../../../components/common/loader/loader';
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
    loading: false,
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

    const sentimentScore = (fakeData.sentiment.document.score + 1) / 2;
    const tooltip = (
      <div>
        <p>
          <strong>Occurence :</strong> nombre de fois où le mot clé apparaît dans le débat ou dans les discussions relatives à la
          thématique en question.
        </p>
        <p>
          <strong>Pertinence :</strong> qualifie l′importance du mot clé pour comprendre le sens général du texte analysé. Le
          score varie de 0 à 1, de faible à fort.
        </p>
      </div>
    );

    return loading || errorLoading ? (
      <Grid className="semantic-analysis">
        {/** Loading section */}
        <Col xs={12}>
          <Loader type={errorLoading ? LOADER_TYPE.ERROR : LOADER_TYPE.LOADING} />
        </Col>
      </Grid>
    ) : (
      <div className="semantic-analysis">
        {/** Description section */}
        <Col xs={12}>
          <Title level={1}>Nuage de mots-clés</Title>
          <Description>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
              aliqua. Ut enim ad minim veniam, quis nostrud.
            </p>
          </Description>
          <WordCountInformation wordCount={23302} />
        </Col>

        {/** WordCloud section */}
        <Col xs={12} md={8}>
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
        <Col xs={12} md={4}>
          <Col xsHidden sm={6} md={12}>
            <TitleWithTooltip level={2} tooltipContent={tooltip}>
              Informations mots-clés
            </TitleWithTooltip>

            <KeywordInfo keyword={keywordData} />
          </Col>

          <Col xsHidden smHidden md={12}>
            <Title level={2}>Nombre de mots-clés</Title>

            <ToolbarSlider
              maxValue={fakeData.keywords.length}
              minValue={this.MIN_WORDS}
              defaultValue={this.NUM_WORDS_DEFAULT}
              onSliderChange={this.onNumberOfKeywordSliderChangeHandler}
            />
          </Col>

          <Col xs={12} sm={6} md={12}>
            <TitleWithTooltip level={2} tooltipContent={tooltip}>
              Analyse du sentiment
            </TitleWithTooltip>

            <SentimentBar value={sentimentScore} />
          </Col>
        </Col>
      </div>
    );
  }
}

export default SemanticAnalysis;