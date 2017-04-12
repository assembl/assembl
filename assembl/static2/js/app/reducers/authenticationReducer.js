const AuthReducer = (state = {signupSuccess: {success: false, reason: null}}, action) => {
  switch (action.type) {
  case 'SIGNUP_SUCCESS':
    return { signupSuccess: {success: true}};
  case 'SIGNUP_INCORRECT_PASSWORD':
    return { signupSuccess: {success: false, reason: 'password'}};
  case 'SIGNUP_GENERAL_ERROR':
    return { signupSuccess: {success: false, reason: 'general'}};
  default:
    return state;
  }
};

export default AuthReducer;