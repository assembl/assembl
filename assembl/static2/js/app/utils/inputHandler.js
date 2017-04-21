/*
  Utility method to handle input events fed from a component via a onChange.
  Note: This is only a helper method for common input types. For more complex actions,
  create unique handlers in the component itself.
  @params component [React] The component in question
  @params inputEvent [SyntheticEvent] The event that is triggered from the onChange
  @returns void
*/
export default (component, inputEvent) => {
  const s = {};
  const name = inputEvent.target.name;
  s[name] = inputEvent.target.value;
  component.setState(s);
};