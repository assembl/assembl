import { Map } from 'immutable';
import { createSelector } from 'reselect';

export const postsByIdSelector = (state) => {
  return state.posts.postsById;
};

export const localeSelector = (state) => {
  return state.i18n.locale;
};

export const idSelector = (_, props) => {
  return props.id;
};

export const postSelector = createSelector(postsByIdSelector, idSelector, (postsById, id) => {
  return postsById.get(id, Map());
});