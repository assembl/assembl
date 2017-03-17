import { isDateExpired, getNumberOfDays, calculatePercentage } from './globalFunctions';

export const isCurrentStep = (index, timeline) => {
  const currentDate = new Date();
  const startDate = new Date(timeline[index].start);
  const endDate = new Date(timeline[index].end);
  const currentStep = isDateExpired(currentDate, startDate) && isDateExpired(endDate, currentDate);
  return currentStep;
};

export const isStepCompleted = (index, timeline) => {
  const currentDate = new Date();
  const endDate = new Date(timeline[index].end);
  return isDateExpired(currentDate, endDate);
};

export const getBarWidth = (index, timeline) => {
  const currentDate = new Date();
  const endDate = new Date(timeline[index].end);
  const stepCompleted = isDateExpired(currentDate, endDate);
  let barWidth = 0;
  if (stepCompleted) {
    barWidth = 100;
  } else {
    const startDate = new Date(timeline[index].start);
    const isStepStarted = isDateExpired(currentDate, startDate);
    if (isStepStarted) {
      const remainingDays = getNumberOfDays(endDate, currentDate);
      const totalDays = getNumberOfDays(endDate, startDate);
      const percentage = calculatePercentage(remainingDays, totalDays);
      barWidth = 100 - percentage;
    }
  }
  return barWidth;
};