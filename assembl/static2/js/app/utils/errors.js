/*
  All special errors are placed here. Creating special errors is very useful
  to manage results of async Action Creators, amongst other things.
*/

export class PasswordMismatchError extends Error {
  constructor(...args) {
    super(...args);
    this.name = 'PasswordMismatchError';
  }
}