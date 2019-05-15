// @flow

export type SynthesisIdea = {
  id: string,
  ancestors: Array<string>,
  title: string,
  synthesisTitle: string,
  live: {
    id: string,
    order: number,
    img: FileDocument,
    numContributors: number,
    numPosts: number,
    messageColumns: Array<IdeaMessageColumnFragment>,
    messageViewOverride: string,
    posts: {
      edges: Array<Object>
    }
  }
};

export type Synthesis = {
  id: string,
  synthesisType: SynthesisTypes,
  subject: string,
  introduction: ?string,
  conclusion: ?string,
  ideas: Array<SynthesisIdea>,
  body: ?string,
  img: FileDocument
};

/* item of synthesis list */
export type SynthesisItem = {
  id: string,
  subject: string,
  creationDate: string,
  post: {
    id: string,
    publicationState: string
  },
  img: FileDocument
};

export type SynthesisPost = {
  id: string,
  publishesSynthesis: Synthesis
};