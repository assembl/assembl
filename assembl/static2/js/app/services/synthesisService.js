import { xmlHttpRequest } from '../utils/httpRequestHandler';
import { getSortedDate } from '../utils/globalFunctions';

const getSynthesisByStatus = (synthesis) => {
  const publishedSynthesis = [];
  const draftSynthesis = [];
  const sortedDate = getSortedDate(synthesis, 'creation_date');
  const latestDate = new Date(sortedDate[sortedDate.length - 1]);
  let lastPublishedSynthesis = {};
  synthesis.forEach((item) => {
    if (!item.is_next_synthesis) publishedSynthesis.push(item);
    else draftSynthesis.push(item);
    const synthesisDate = new Date(item.creation_date);
    if (latestDate.valueOf() === synthesisDate.valueOf()) lastPublishedSynthesis = item;
  });
  return [publishedSynthesis, draftSynthesis, lastPublishedSynthesis];
};

export const buildSynthesis = (synthesis) => {
  const allSynthesis = getSynthesisByStatus(synthesis);
  return {
    publishedSynthesis: allSynthesis[0],
    draftSynthesis: allSynthesis[1],
    lastPublishedSynthesis: allSynthesis[2]
  };
};

export const getSynthesis = (debateId) => {
  const fetchUrl = `/api/v1/discussion/${debateId}/explicit_subgraphs/synthesis`;
  return xmlHttpRequest({ method: 'GET', url: fetchUrl }).then((synthesis) => {
    return buildSynthesis(synthesis);
  });
};