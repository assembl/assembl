/* @flow */
/* eslint-disable */
export type IdeaMessageColumns = Array<IdeaMessageColumnFragment>;

type Post = PostFragment & {
  messageClassifier: ?string,
  creationDate: string,
  parentId: number
};

type EditableDocument = DocumentFragment & {
  file?: File
};
