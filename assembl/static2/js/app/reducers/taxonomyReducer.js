// @flow
import { ADD_TAXONOMY_SUCCEEDED, ADD_TAXONOMY_FAILED, ADD_TAXONOMY_STARTED } from '../actions/actionTypes';

const initialState = {
  loading: false,
  error: null,
  data: {}
};

// TODO need to set state and action type
const taxonomyReducer = (state: any = initialState, action: any) => {
  switch (action.type) {
  case ADD_TAXONOMY_SUCCEEDED:
    return {
      ...state,
      loading: false,
      error: null,
      data: action.payload
    };
  case ADD_TAXONOMY_FAILED:
    return {
      ...state,
      loading: false,
      error: action.payload
    };
  case ADD_TAXONOMY_STARTED:
    return {
      ...state,
      loading: true
    };
  default:
    return state;
  }
};

export default taxonomyReducer;