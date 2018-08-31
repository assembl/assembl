// @flow
import React from 'react';

import { customFictionsList } from '../../stories/components/debate/brightMirror/fictionsList.stories';
import { customInstructionsText } from '../../stories/components/debate/brightMirror/instructionsText.stories';
import InstructionView from '../../components/debate/brightMirror/instructionView';
import type { InstructionViewProps } from '../../components/debate/brightMirror/instructionView';

const timeline = [
  {
    identifier: 'brightMirror',
    start: '1900-01-01T02:00:00Z',
    end: '2200-01-01T00:00:00Z',
    title: 'brightMirror'
  }
];
const props: InstructionViewProps = {
  isUserConnected: true,
  ideaId: '0',
  refetchIdea: Function,
  timeline: timeline,
  announcementContent: customInstructionsText,
  lang: 'en',
  ...customFictionsList
};

const index = () => <InstructionView {...props} />;

export default index;