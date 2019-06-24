// @flow
import countBy from 'lodash/countBy';
import get from 'lodash/get';

export const addEnumSuffixToModuleTitles = (modules: Array<LandingPageModule>): Array<LandingPageModule> => {
  // Add a suffix to the title of the module if this module appears more than one time.
  // This suffix is the number of times this module appeared in the array.
  const moduleTypeTitles = modules.map(module => ({ title: module.moduleType.title }));
  const titleCounts = countBy(moduleTypeTitles, 'title');
  const duplicatesCurrentIndex = {};
  return modules.map((module) => {
    const { title } = module.moduleType;
    if (title && titleCounts[title] > 1) {
      duplicatesCurrentIndex[title] = get(duplicatesCurrentIndex, title, 0) + 1;
      return { ...module, moduleType: { ...module.moduleType, title: title && `${title} ${duplicatesCurrentIndex[title]}` } };
    }
    return module;
  });
};