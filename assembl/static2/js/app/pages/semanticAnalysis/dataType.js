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

// Created to fix flow issues because SuggestedTags is a substract type of a GraphQL fragment
export type SuggestedTags = ?Array<?{|
  score: ?number,
  count: ?number,
  value: ?string
|}>;

// Created to fix flow issues because Tags is a substract type of a GraphQL fragment
export type Tags = ?Array<?{|
  id: string,
  value: string
|}>;