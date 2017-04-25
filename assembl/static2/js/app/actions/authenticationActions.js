import { signUp, changePasswordRequest } from '../services/authenticationService';


const signupSuccess = () => {
  return {
    type: 'SIGNUP_SUCCESS'
  };
};

const signupIncorrectPassword = () => {
  return {
    type: 'SIGNUP_INCORRECT_PASSWORD'
  };
};

const signupGeneralError = (error) => {
  return {
    type: 'SIGNUP_GENERAL_ERROR',
    error: error
  };
};

export const signupAction = (payload) => {
  return (dispatch) => {
    return signUp(payload).then(() => {
      dispatch(signupSuccess());
    }).catch((error) => {
      // Should match on a more generic thing that accounts for JS errors +
      // server returned errors
      switch (error.name) {
      case 'PasswordMismatchError': {
        return dispatch(signupIncorrectPassword());
      }
      default: {
        return dispatch(signupGeneralError(error));
      }
      }
    });
  };
};


const passwordRequestSuccess = {
  type: 'REQUEST_PASSWORD_CHANGE_SUCCESS'
};

const passwordRequestError = {
  type: 'REQUEST_PASSWORD_CHANGE_ERROR'
};

export const requestPasswordChangeAction = (id, discussionSlug) => {
  return (dispatch) => {
    return changePasswordRequest(id, discussionSlug).then(
      () => {
        dispatch(passwordRequestSuccess);
      }
    )
    .catch(() => {
      dispatch(passwordRequestError);
    });
  };
};