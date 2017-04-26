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
      /*
        The signup can either throw an exception, or the server responds
        with a valid error, response will be a JSON that can be parsed for further information.
        Can match errors with in `assembl.views.api2.auth.signup_error_types`
      */
      let errorDispatch;
      if (error instanceof Error) {
        if (error.name === 'PasswordMismatchError') {
          errorDispatch = dispatch(signupIncorrectPassword());
        }
      } else {
        errorDispatch = dispatch(signupGeneralError(error));
      }
      return errorDispatch;
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