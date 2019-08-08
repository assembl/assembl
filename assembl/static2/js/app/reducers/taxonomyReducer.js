import { ADD_TAXONOMY_SUCCEEDED, ADD_TAXONOMY_FAILED, ADD_TAXONOMY_STARTED } from '../actions/actionTypes';

const initialState = {
  loading: false,
  error: null,
  taxonomyPayload: {}
};

const taxonomyReducer = (state = initialState, action) => {
  switch (action.type) {
  case ADD_TAXONOMY_SUCCEEDED:
    return {
      ...state,
      loading: false,
      error: null,
      taxonomyPayload: action.payload
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