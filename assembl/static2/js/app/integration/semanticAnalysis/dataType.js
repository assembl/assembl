// @flow
export type Sentiment = {
  count: number,
  negative: number,
  positive: number
};

export type Keyword = {
  count: number,
  score: number,
  value: string
};

export type Keywords = Array<Keyword>;

export type SemanticAnalysisData = {
  nlpSentiment: Sentiment,
  topKeywords: Keywords
};