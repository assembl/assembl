set -e
assembl-graphql-schema-json local.ini
cd assembl/static2
yarn add apollo-codegen@0.19.1 -W
./node_modules/.bin/apollo-codegen generate js/app/graphql/*.graphql js/app/graphql/fragments/*.graphql js/app/graphql/mutations/*.graphql --schema /tmp/schema.json --target flow --output flow/graphql_types.flow.js
./node_modules/.bin/prettier-eslint --write flow/graphql_types.flow.js
git checkout package.json yarn.lock
rm -rf node_modules/
yarn
supervisorctl restart dev:webpack
