#!/bin/sh

# This script try to connect to elastic search and access the DB
# return 0 if success / return 1 if error

# exit if no parameter given
if [ "$1" == "" ]
then
    echo "You should pass local.ini as argument"
    exit 1
fi

# parse elasticsearch_host from local.ini
elasticsearch_host="$(cat $1 | grep "elasticsearch_host")"
elasticsearch_host=${elasticsearch_host// /}
elasticsearch_host=${elasticsearch_host//elasticsearch_host=/}

# parse elasticsearch_port from local.ini
elasticsearch_port="$(cat $1 | grep "elasticsearch_port")"
elasticsearch_port=${elasticsearch_port// /}
elasticsearch_port=${elasticsearch_port//elasticsearch_port=/}

# parse elasticsearch_index from local.ini
elasticsearch_index="$(cat $1 | grep "elasticsearch_index")"
elasticsearch_index=${elasticsearch_index// /}
elasticsearch_index=${elasticsearch_index//elasticsearch_index=/}

# parse elasticsearch_version from local.ini
elasticsearch_version="$(cat $1 | grep "elasticsearch_version")"
elasticsearch_version=${elasticsearch_version// /}
elasticsearch_version=${elasticsearch_version//elasticsearch_version=/}

ELASTICSEARCH_URL=http://${elasticsearch_host}:${elasticsearch_port}

CURL="$(curl --fail --silent --show-error ${ELASTICSEARCH_URL} 2>&1)"

# if curl didn't succeed 
if [ $? != 0 ]
then
    echo "Fail to connect to elatic search"
    echo "${CURL}"
    exit 1
fi

# clear line to keep cluster_name value only
CLUSTER_NAME=$(echo "${CURL}" | grep "cluster_name")
CLUSTER_NAME=${CLUSTER_NAME// /}
CLUSTER_NAME=${CLUSTER_NAME//\"/}
CLUSTER_NAME=${CLUSTER_NAME//cluster_name:/}
CLUSTER_NAME=${CLUSTER_NAME//,/}

# clear line to keep version number value only
VERSION=$(echo "${CURL}" | grep "number")
VERSION=${VERSION// /}
VERSION=${VERSION//\"/}
VERSION=${VERSION//number:/}
VERSION=${VERSION//,/}

# Check Elasticsearch cluster name and version
if ([ "$CLUSTER_NAME" != "$elasticsearch_index" ] || [ "$VERSION" != "$elasticsearch_version" ])
then
    exit 1
fi

# Check if database is accessible
psql -Uassembl assembl -c "SELECT * FROM pg_catalog.pg_tables" &> /dev/null
if [ $? != 0 ]
then
    exit 1
fi

# everything is good
exit 0