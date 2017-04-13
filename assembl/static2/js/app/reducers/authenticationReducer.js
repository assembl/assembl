const defaultCase = {
  signupSuccess: {
    success: false,
    reason: null
  },
  passwordChangeRequest: {
    success: null
  }
}

const AuthReducer = (state = defaultCase, action) => {
  switch (action.type) {
  case 'SIGNUP_SUCCESS':
    return { signupSuccess: {success: true}};
  case 'SIGNUP_INCORRECT_PASSWORD':
    return { signupSuccess: {success: false, reason: 'password'}};
  case 'SIGNUP_GENERAL_ERROR':
    return { signupSuccess: {success: false, reason: 'general'}};
  
  case 'REQUEST_PASSWORD_CHANGE_SUCCESS': 
    return { passwordChangeRequest: { success: true}};
  case 'REQUEST_PASSWORD_CHANGE_ERROR':
    return { passwordChangeRequest: { success: false}};
  default:
    return state;
  }
};

export default AuthReducer;