// @flow
export type Usage = {
  text_units: number,
  text_characters: number,
  features: number
};

export type Document = {
  score: number,
  label: string
};

export type Sentiment = {
  document: Document
};

export type Language = string;

export type Keyword = {
  text: string,
  relevance: number,
  count: number
};
export type Keywords = Array<Keyword>;

export type Disambiguation = {
  subtype: Array<string>,
  name: string,
  dbpedia_resource: string
};
export type Entity = {
  type: string,
  text: string,
  relevance: number,
  disambiguation?: Disambiguation,
  count: number
};
export type Entites = Array<Entity>;

export type Concept = {
  text: string,
  relevance: number,
  dbpedia_resource: string
};
export type Concepts = Array<Concept>;

export type Category = {
  score: number,
  label: string
};
export type Categories = Array<Category>;

export type Data = {
  usage: Usage,
  sentiment: Sentiment,
  language: Language,
  keywords: Keywords,
  entities: Entites,
  concepts: Concepts,
  categories: Categories
};