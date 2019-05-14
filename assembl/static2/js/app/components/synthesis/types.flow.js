// @flow
import type { FileValue } from '../form/types.flow';

export type Synthesis = {
  id: string,
  synthesisType: SynthesisTypes,
  subject: string,
  body: string,
  img: FileValue
};

/* item of synthesis list */
export type SynthesisItem = {
  id: string,
  subject: string,
  creationDate: string,
  post: {
    id: string,
    publicationState: string
  },
  img: FileValue
};

export type SynthesisPost = {
  id: string,
  publishesSynthesis: Synthesis
};