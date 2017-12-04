ARG version
FROM docker.elastic.co/elasticsearch/elasticsearch:${version}
ARG version
RUN \
  ./bin/elasticsearch-plugin install https://artifacts.elastic.co/downloads/elasticsearch-plugins/analysis-smartcn/analysis-smartcn-${version}.zip && \
  ./bin/elasticsearch-plugin install https://artifacts.elastic.co/downloads/elasticsearch-plugins/analysis-kuromoji/analysis-kuromoji-${version}.zip
