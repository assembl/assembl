import React from 'react';
import renderer from 'react-test-renderer';

import TabbedContent from '../../../../js/app/components/common/tabbedContent';

describe('TabbedContent component', () => {
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
  it('should match snapshot', () => {
    const rendered = renderer
      .create(<TabbedContent tabTitleMsgId="debate.survey.thematicNumerotation" tabs={tabs} renderBody={renderBody} />)
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should match snapshot with divClassName', () => {
    const rendered = renderer
      .create(
        <TabbedContent
          tabTitleMsgId="administration.timelineAdmin.phase"
          divClassName="right"
          tabs={tabs}
          renderBody={renderBody}
        />
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should match snapshot with bodyRowClassName', () => {
    const rendered = renderer
      .create(
        <TabbedContent
          bodyRowClassName="right"
          tabTitleMsgId="debate.survey.thematicNumerotation"
          tabs={tabs}
          renderBody={renderBody}
        />
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });
});