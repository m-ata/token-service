#!/usr/bin/env bash
curl 'http://127.0.0.1:53003/token'   -H 'Content-Type: application/x-www-form-urlencoded;charset=UTF-8'   --data-raw "grant_type=password&client_id=fishreg&code=${1}" | jq -r '.access_token'
