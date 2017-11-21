// @flow

export const orderPostsByMessageClassifier = (messageColumns: IdeaMessageColumns, posts: Array<Post>) => {
  return messageColumns.reduce((naziLinter, col) => {
    const keyName = col.messageClassifier;
    const columnsMap = naziLinter;
    columnsMap[keyName] = posts.filter((post) => {
      return post.messageClassifier === keyName;
    });
    return columnsMap;
  }, {});
};