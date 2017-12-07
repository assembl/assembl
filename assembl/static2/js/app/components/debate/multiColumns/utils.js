// @flow

export const orderPostsByMessageClassifier = (messageColumns: IdeaMessageColumns, posts: Array<Post>) =>
  messageColumns.reduce((naziLinter, col) => {
    const keyName = col.messageClassifier;
    const columnsMap = naziLinter;
    columnsMap[keyName] = posts.filter(post => post.messageClassifier === keyName);
    return columnsMap;
  }, {});