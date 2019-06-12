/*
  Stories for components/common
*/
import React from 'react';
import { storiesOf } from '@storybook/react';

import Loader from '../../../components/common/loader';
import SwitchButton from '../../../components/common/switchButton';

storiesOf('Loader', module)
  .add('with text', () => <Loader textHidden={false} />)
  .add('with text and color', () => <Loader color="#891" />)
  .add('with text hidden', () => <Loader textHidden />)
  .add('with text hidden and color', () => <Loader color="#933" textHidden />);

storiesOf('SwitchButton', module)
  .add('default', () => <SwitchButton />)
  .add('checked by default', () => <SwitchButton defaultChecked />)
  .add('with label', () => <SwitchButton label="Please toggle me" />);