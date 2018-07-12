/*
  Stories for components/common
*/
import React from 'react';
import { storiesOf } from '@storybook/react';
import { Link } from 'react-router';

import Card from '../../../components/common/card';
import Loader from '../../../components/common/loader';
import SwitchButton from '../../../components/common/switchButton';
import TabbedContent from '../../../components/common/tabbedContent';

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

const tabs = [
  {
    id: 'tab1',
    title: 'One',
    text: 'If we override the transmitter, we can get to the PNG bus through the solid state RSS alarm!'
  },
  { id: 'tab2', title: 'Two', text: 'I\'ll input the auxiliary RSS monitor, that should feed the ADP monitor!' },
  {
    id: 'tab3',
    title: 'Three',
    text: 'The ADP matrix is down, quantify the neural protocol so we can program the COM firewall!'
  }
];
const renderBody = (tab, idx) => (
  <div className="box">
    <h2>
      {tab.title} ({idx + 1})
    </h2>
    <p>{tab.text}</p>
  </div>
);

storiesOf('TabbedContent', module)
  .add('default', () => <TabbedContent tabs={tabs} renderBody={renderBody} />)
  .add('with divClassName', () => <TabbedContent divClassName="right" tabs={tabs} renderBody={renderBody} />)
  .add('with bodyRowClassName', () => <TabbedContent bodyRowClassName="right" tabs={tabs} renderBody={renderBody} />);