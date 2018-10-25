#!/bin/sh

# This script try to connect to elastic search and access the DB
# return 0 if success / return 1 if error

ASSEMBL_ROOT=$VIRTUAL_ENV/..
LOCAL_INI=$ASSEMBL_ROOT/local.ini

# parse elasticsearch_host from local.ini
elasticsearch_host="$(grep "elasticsearch_host" $LOCAL_INI | tr -d ' ' | awk -F "=" '{print $2}')"

# parse elasticsearch_port from local.ini
elasticsearch_port="$(grep "elasticsearch_port" $LOCAL_INI | tr -d ' ' | awk -F "=" '{print $2}')"

# parse elasticsearch_index from local.ini
elasticsearch_index="$(grep "elasticsearch_index" $LOCAL_INI | tr -d ' ' | awk -F "=" '{print $2}')"

# parse elasticsearch_version from local.ini
elasticsearch_version="$(grep "elasticsearch_version" $LOCAL_INI | tr -d ' ' | awk -F "=" '{print $2}')"

ELASTICSEARCH_URL=http://${elasticsearch_host}:${elasticsearch_port}

CURL="$(curl --fail --silent --show-error ${ELASTICSEARCH_URL} 2>&1)"

# if curl didn't succeed 
if [ $? != 0 ]; then
    printf "Failed to connect to Elaticsearch server with failure: \t %s\n" "$CURL"
    exit 1
fi

# Install jq if necessary
which jq > /dev/null
if [ $? == 1 ]; then
    if [ $(uname) == "Darwin" ]; then
        brew install jq
    elif [ $(uname) == "Linux" ]; then
        sudo apt-get install -y jq
    fi
fi
# Parse json to keep cluster_name value only
CLUSTER_NAME=$(echo $CURL | jq '.cluster_name' | tr -d "\"")

# Parse json to keep version number value only
VERSION=$(echo $CURL | jq '.version.number' | tr -d "\"")

# Check Elasticsearch cluster name and version
if ([ "$CLUSTER_NAME" != "$elasticsearch_index" ] || [ "$VERSION" != "$elasticsearch_version" ]); then
    echo "Wrong Elasticseach cluster name or version"
    exit 1
fi

# Check if database is accessible
NB_TABLE="$(psql -Uassembl assembl -c "SELECT * FROM pg_catalog.pg_tables;" | grep public | wc -l | tr -d ' ')"
if [ $NB_TABLE -lt 1 ]; then
    printf "Database isn't accessible \t %s\n" "$NB_TABLE"
    exit 1
fi

# everything is good
echo "Elasticsearch and database check successful" >> $ASSEMBL_ROOT/var/log/assembl.log
exit 0