// @flow

export const updateTags = (tags: Array<Tag>) => ({
  tags: tags,
  type: 'UPDATE_TAGS'
});