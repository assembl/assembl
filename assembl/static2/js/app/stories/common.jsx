/*
  Stories for components/common
*/
import React from 'react';
import { storiesOf } from '@storybook/react';
import { Link } from 'react-router';

import Card from '../components/common/card';
import Loader from '../components/common/loader';
import SwitchButton from '../components/common/switchButton';

const cardContent = (
  <Link className="content-box">
    <div className="title-container center">
      <h3 className="light-title-3">Sunt quas ratione culpa</h3>
      <h4 className="light-title-4">
        Commodi architecto fugiat maxime quod. Dignissimos aut atque. Qui autem qui et sed voluptas iure suscipit. Est sit alias
        voluptatibus. Aliquam aperiam dolores dolores sint.
      </h4>
    </div>
  </Link>
);

const imgUrl = 'https://images.unsplash.com/uploads/141155339325423394b24/03982423';

storiesOf('Card', module)
  .add('default', () => <Card>{cardContent}</Card>)
  .add('with className (margin)', () => <Card className="margin-xxl">{cardContent}</Card>)
  .add('with imgUrl', () => <Card imgUrl={imgUrl}>{cardContent}</Card>);

storiesOf('Loader', module)
  .add('with text', () => <Loader textHidden={false} />)
  .add('with text and color', () => <Loader color="#891" />)
  .add('with text hidden', () => <Loader textHidden />)
  .add('with text hidden and color', () => <Loader color="#933" textHidden />);

storiesOf('SwitchButton', module)
  .add('default', () => <SwitchButton />)
  .add('checked by default', () => <SwitchButton defaultChecked />)
  .add('with label', () => <SwitchButton label="Please toggle me" />);