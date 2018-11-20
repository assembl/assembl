// @flow
import React from 'react';
import get from 'lodash/get';

import { type ColorDefinition, type ExtractState, ExtractStates, harvestingColors, harvestingColorsMapping } from '../constants';
import DesignFiction from '../components/svg/taxonomy/displayDesignFiction';
import MultiColumn from '../components/svg/taxonomy/displayMultiColumn';
import OpenQuestions from '../components/svg/taxonomy/displayOpenQuestions';
import Thread from '../components/svg/taxonomy/displayThread';
import Tokens from '../components/svg/taxonomy/displayTokens';
import ToArgument from '../components/svg/taxonomy/toArgument';
import MixMatch from '../components/svg/taxonomy/mixMatch';
import Example from '../components/svg/taxonomy/example';
import Classify from '../components/svg/taxonomy/classify';
import MoreSpecific from '../components/svg/taxonomy/moreSpecific';
import MakeGeneric from '../components/svg/taxonomy/makeGeneric';
import Flag from '../components/svg/taxonomy/Flag';

export const extractNatures = [
  {
    qualifier: 'issue',
    label: 'search.taxonomy_nature.issue'
  },
  {
    qualifier: 'actionable_solution',
    label: 'search.taxonomy_nature.actionable_solution'
  },
  {
    qualifier: 'knowledge',
    label: 'search.taxonomy_nature.knowledge'
  },
  {
    qualifier: 'example',
    label: 'search.taxonomy_nature.example'
  },
  {
    qualifier: 'concept',
    label: 'search.taxonomy_nature.concept'
  },
  {
    qualifier: 'argument',
    label: 'search.taxonomy_nature.argument'
  },
  {
    qualifier: 'cognitive_bias',
    label: 'search.taxonomy_nature.cognitive_bias'
  }
];

export const extractActions = [
  {
    qualifier: 'classify',
    label: 'search.taxonomy_action.classify'
  },
  {
    qualifier: 'make_generic',
    label: 'search.taxonomy_action.make_generic'
  },
  {
    qualifier: 'argument',
    label: 'search.taxonomy_action.argument'
  },
  {
    qualifier: 'give_examples',
    label: 'search.taxonomy_action.give_examples'
  },
  {
    qualifier: 'more_specific',
    label: 'search.taxonomy_action.more_specific'
  },
  {
    qualifier: 'mix_match',
    label: 'search.taxonomy_action.mix_match'
  },
  {
    qualifier: 'display_multi_column',
    label: 'search.taxonomy_action.display_multi_column'
  },
  {
    qualifier: 'display_thread',
    label: 'search.taxonomy_action.display_thread'
  },
  {
    qualifier: 'display_tokens',
    label: 'search.taxonomy_action.display_tokens'
  },
  {
    qualifier: 'display_open_questions',
    label: 'search.taxonomy_action.display_open_questions'
  },
  {
    qualifier: 'display_bright_mirror',
    label: 'search.taxonomy_action.display_bright_mirror'
  }
];

type ActionIconsProps = {
  qualifier: string,
  backgroundColor: string,
  color: string
};

export const ActionIcons = ({ qualifier, backgroundColor, color }: ActionIconsProps) => {
  switch (qualifier) {
  case 'display_bright_mirror':
    return <DesignFiction backgroundColor={backgroundColor} color={color} />;
  case 'display_multi_column':
    return <MultiColumn backgroundColor={backgroundColor} color={color} />;
  case 'display_open_questions':
    return <OpenQuestions backgroundColor={backgroundColor} color={color} />;
  case 'display_thread':
    return <Thread backgroundColor={backgroundColor} color={color} />;
  case 'display_tokens':
    return <Tokens backgroundColor={backgroundColor} color={color} />;
  case 'argument':
    return <ToArgument backgroundColor={backgroundColor} color={color} />;
  case 'mix_match':
    return <MixMatch backgroundColor={backgroundColor} color={color} />;
  case 'give_examples':
    return <Example backgroundColor={backgroundColor} color={color} />;
  case 'classify':
    return <Classify backgroundColor={backgroundColor} color={color} />;
  case 'more_specific':
    return <MoreSpecific backgroundColor={backgroundColor} color={color} />;
  case 'make_generic':
    return <MakeGeneric backgroundColor={backgroundColor} color={color} />;
  default:
    return <span>{qualifier}</span>;
  }
};

function getTaxonomyNatureColor(nature: string): ColorDefinition | null {
  return get(harvestingColorsMapping, nature, null);
}

type NatureIconProps = {
  qualifier: string
};

export const NatureIcons = ({ qualifier }: NatureIconProps) => {
  const color = getTaxonomyNatureColor(qualifier);
  if (color) {
    return <Flag color={color.background} />;
  }

  return <span>{qualifier}</span>;
};

export const getExtractTagId = (id: number) => `message-body-local:Content/${id}`;

export function getExtractColor(nature: string, state: ExtractState, extractedByMachine: boolean): ColorDefinition {
  const defaultColor = harvestingColors.green2;
  if (extractedByMachine) {
    if (state === ExtractStates.SUBMITTED) {
      return harvestingColors.pink;
    } else if (state === ExtractStates.PUBLISHED) {
      return harvestingColors.paleGreen;
    }
  }

  const natureColor = getTaxonomyNatureColor(nature.replace('Enum.', ''));
  return natureColor || defaultColor;
}