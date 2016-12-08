var React = require('react');
var ReactDOM = require('react-dom/server');

var I18n = require('react-i18nify').I18n;
var Translate = require('react-i18nify').Translate;
var Localize = require('react-i18nify').Localize;

I18n.setTranslations({
  en: {
    application: {
      title: 'Awesome app with i18n!',
      hello: 'Hello, %{name}!'
    },
    date: {
      long: 'MMMM Do, YYYY'
    },
    export: 'Export %{count} items',
    export_0: 'Nothing to export',
    export_1: 'Export %{count} item'
  },
  nl: {
    application: {
      title: 'Toffe app met i18n!',
      hello: 'Hallo, %{name}!'
    },
    date: {
      long: 'D MMMM YYYY'
    },
    export: 'Exporteer %{count} dingen',
    export_0: 'Niks te exporteren',
    export_1: 'Exporteer %{count} ding'
  }
});

I18n.setLocale('nl');

console.log(I18n.t('application.title'));
console.log(I18n.t('application.hello', {name: 'Aad'}));
console.log(I18n.t('export', {count: 0}));
console.log(I18n.t('application.weird_key'));
console.log(I18n.t('application', {name: 'Aad'}));

console.log(I18n.l(1385856000000, { dateFormat: 'date.long' }));
console.log(I18n.l(Math.PI, { maximumFractionDigits: 2 }));

function AwesomeComponent() {
  return (
    <div>
      <Translate value="application.title" />
      <br />
      <Translate value="application.hello" name="Aad" />
      <br />
      <Localize value="2015-09-03" dateFormat="date.long" />
      <br />
      <Localize value={10/3} options={{style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2}} />
      <br />
      <Translate value="export" count={1} />
      <br />
      <Translate value="export" count={2} />
    </div>
  );
}

ReactDOM.renderToString(<AwesomeComponent/>);
