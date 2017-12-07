import { signUp, changePasswordRequest } from '../services/authenticationService';

const signupSuccess = () => ({
  type: 'SIGNUP_SUCCESS'
});
const signupIncorrectPassword = () => ({
  type: 'SIGNUP_INCORRECT_PASSWORD'
});
const signupGeneralError = error => ({
  type: 'SIGNUP_GENERAL_ERROR',
  error: error
});
export const signupAction = payload => dispatch =>
  signUp(payload)
    .then(() => {
      dispatch(signupSuccess());
    })
    .catch((error) => {
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
const passwordRequestSuccess = {
  type: 'REQUEST_PASSWORD_CHANGE_SUCCESS'
};
const passwordRequestError = error => ({
  type: 'REQUEST_PASSWORD_CHANGE_ERROR',
  data: error
});
export const requestPasswordChangeAction = (id, discussionSlug) => dispatch =>
  changePasswordRequest(id, discussionSlug)
    .then(() => {
      dispatch(passwordRequestSuccess);
    })
    .catch((error) => {
      dispatch(passwordRequestError(error));
    });