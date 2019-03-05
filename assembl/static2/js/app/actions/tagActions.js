export const additionTag = tag => ({
  type: 'ADD_TAG',
  tag: tag
});

export const deleteTag = i => ({
  type: 'DELETE_TAG',
  tagKey: i
});