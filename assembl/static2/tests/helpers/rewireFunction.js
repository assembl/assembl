const rewireFunction = (RewireAPI, functionName, mock, callback) => {
  RewireAPI.__Rewire__(functionName, mock); // eslint-disable-line no-underscore-dangle
  const ret = callback();
  RewireAPI.__ResetDependency__(functionName); // eslint-disable-line no-underscore-dangle
  return ret;
};

export default rewireFunction;