import { signUp } from '../services/authenticationService';


const signupSuccess = () => {
  return {
    type: 'SIGNUP_SUCCESS'
  }
};

const signupIncorrectPassword = () => {
  return {
    type: 'SIGNUP_INCORRECT_PASSWORD'
  }
};

const signupGeneralError = (error) => {
  return {
    type: 'SIGNUP_GENERAL_ERROR',
    error: error
  }
};

export const signupAction = (payload) => {
  return (dispatch) => {
    return signUp(payload).then((success) => {
      dispatch(signupSuccess());
    }).catch((error) => {
      switch (error.name) {
        case 'TypeError': {
          return dispatch(signupIncorrectPassword());
        }
        default: {
          return dispatch(signupGeneralError(error));
        }
      }
    });
  };
};