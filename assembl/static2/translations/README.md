This folder contains a generated json file for each language excepted for English.

The English messages are maintained manually in
`js/app/utils/translations.js`


# Export messages to po files

To export the messages, meaning converting English messages from
`js/app/utils/translations.js` to a `locale/assembl-v2.pot` file, run

    npm run i18n:export

This generates an intermediate file static2/messages.json from which we generate the
pot file using react-intl-po (but we don't use react-intl or
babel-plugin-react-intl in this project).

The `i18n:export` command takes care of resyncing the existing `locale/assembl-v2/*.po`
files with the pot file with the msgmerge command.
To have the msgmerge command on debian/Ubuntu `apt-get install gettext`, and on
macOS `brew install gettext; brew link gettext`.


# Add a new language

If you want to add a new language, say Japanese, copy `assembl-v2.pot` to
`assembl-v2/jp.po` and add the following two lines in `js/app/utils/translations.js`

    import jp from '../../../translations/jp.json';
    Translations.jp = deepen(jp);

Edit the po file with a dedicated editor like https://poedit.net


# Import translations

To see the translations from the po files in the interface, you need to run

   npm run i18n:import

which generates a json file per language in the translations directory.
Those files are imported from `./js/app/utils/globalFunctions.js` and
the dotted keys are transformed to a nested objects structure to be able to
use them with react-redux-i18n.
The json files are included in the js bundle via the webpack json loader.
