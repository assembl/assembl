// @flow
import React from 'react';

import Question, { type Props } from './question';

const QuestionModeratePosts = (props: Props) => <Question {...props} isModerating />;

export default QuestionModeratePosts;