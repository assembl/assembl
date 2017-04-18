/*
  Utility method to handle input events fed from a component via a onChange.
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