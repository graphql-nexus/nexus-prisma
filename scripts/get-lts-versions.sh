#!/bin/bash
set -exo pipefail

json=$(curl -s https://raw.githubusercontent.com/nodejs/Release/master/schedule.json)

current_date=$(date +%Y-%m-%d)

lts_versions=$(echo "$json" | jq -c "[ to_entries[] | select(.value.lts != null and .value.maintenance >= \"$current_date\" and .value.end >= \"$current_date\") | .key[1:] | tonumber ] | sort ")
last_lts_version=$(echo "$json" | jq -c "[ to_entries[] | select(.value.lts != null and .value.maintenance >= \"$current_date\" and .value.end >= \"$current_date\") | .key[1:] | tonumber ] | sort | .[-1:]")
echo "matrix_lts_versions=$lts_versions" >> $GITHUB_OUTPUT
echo "matrix_last_lts_version=[$last_lts_version]" >> $GITHUB_OUTPUT
echo "last_lts_version=$last_lts_version" >> $GITHUB_OUTPUT