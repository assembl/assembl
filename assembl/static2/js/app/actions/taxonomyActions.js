// @flow
import axios from 'axios';
import type { Dispatch as ReduxDispatch } from 'redux';
import { ADD_TAXONOMY_SUCCEEDED, ADD_TAXONOMY_FAILED, ADD_TAXONOMY_STARTED } from '../actions/actionTypes';
import { MAGNUS_IDEA_ENDPOINT } from '../constants';

const addTaxonomySucceeded = payload => ({
  type: ADD_TAXONOMY_SUCCEEDED,
  payload: { ...payload }
});

const addTaxonomyFailed = message => ({
  type: ADD_TAXONOMY_FAILED,
  payload: message
});

const addTaxonomyStarted = () => ({
  type: ADD_TAXONOMY_STARTED
});

export const addTaxonomy = (taxonomy: any) => (dispatch: ReduxDispatch) => {
  dispatch(addTaxonomyStarted());

  axios
    .post(MAGNUS_IDEA_ENDPOINT, taxonomy)
    .then((response) => {
      dispatch(addTaxonomySucceeded(response.data));
    })
    .catch((error) => {
      dispatch(addTaxonomyFailed(error.message));
    });
};