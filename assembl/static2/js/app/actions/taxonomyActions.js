// @flow
import axios from 'axios';
import type { Dispatch as ReduxDispatch } from 'redux';
import { ADD_TAXONOMY_SUCCEEDED, ADD_TAXONOMY_FAILED, ADD_TAXONOMY_STARTED } from '../actions/actionTypes';

const STARGATE_ENDPOINT = 'https://api.github.com/users/assembl';

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

// eslint-disable-next-line no-unused-vars
export const addTaxonomy = (taxonomy: string) => (dispatch: ReduxDispatch) => {
  dispatch(addTaxonomyStarted());
  // console.log('state when started:', getState().taxonomy);

  // axios.post(stargateUrl, { taxonomy: taxonomy })
  axios
    .get(STARGATE_ENDPOINT)
    .then((response) => {
      dispatch(addTaxonomySucceeded(response.data));
      // console.log('state when succeeded:', getState().taxonomy);
    })
    .catch((error) => {
      dispatch(addTaxonomyFailed(error.message));
      // console.log('state when failed:', getState().taxonomy);
    });
};