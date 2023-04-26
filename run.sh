#!/usr/bin/env bash
export DEBUG="${DEBUG:-1}"
export TEMP_DIR="/tmp"
export FISHREG_ENV="${FISHREG_ENV:-dev}"
export FISHREG_PROJECT="token-service"
export KUBECONFIG=~/.kube/config.olsicloud2

function getServiceCredential() {
  kubectl -n fishreg-${FISHREG_ENV} get secret service-credentials -o json  | jq -r ".data.${1}" | base64 -d
}
function getProjectCredential() {
  kubectl -n fishreg-${FISHREG_ENV} get secret project-credentials -o json  | jq -r ".data.${1}" | base64 -d
}
function getServiceTLSCertificate() {
  kubectl -n fishreg-${FISHREG_ENV} get secret mongodb-client-tls -o json | jq -r '.data."tls.crt"' | base64 -d
}

export WORK_DIR="${TEMP_DIR}/fishreg-${FISHREG_ENV}/${FISHREG_PROJECT}"
####################
### CERTIFICATES ###
####################

mkdir -p "${WORK_DIR}/certs"
kubectl -n fishreg-${FISHREG_ENV} get secret mongodb-client-tls -o json | jq -r '.data."tls.crt"' | base64 -d > ${WORK_DIR}/certs/${FISHREG_PROJECT}-mongodb-client.tls.crt
kubectl -n fishreg-${FISHREG_ENV} get secret mongodb-client-tls -o json | jq -r '.data."tls-combined.pem"' | base64 -d > ${WORK_DIR}/certs/${FISHREG_PROJECT}-mongodb-client.tls-combined.pem
kubectl -n fishreg-${FISHREG_ENV} get secret mongodb-client-tls -o json | jq -r '.data."tls.key"' | base64 -d > ${WORK_DIR}/certs/${FISHREG_PROJECT}-mongodb-client.tls.key
kubectl -n fishreg-${FISHREG_ENV} get secret mongodb-client-tls -o json | jq -r '.data."ca.crt"' | base64 -d > ${WORK_DIR}/certs/${FISHREG_PROJECT}-mongodb-client.ca.crt

kubectl -n fishreg-${FISHREG_ENV} get secret token-service-tls -o json | jq -r '.data."tls.crt"' | base64 -d > ${WORK_DIR}/certs/${FISHREG_PROJECT}-token-service.tls.crt
kubectl -n fishreg-${FISHREG_ENV} get secret token-service-tls -o json | jq -r '.data."tls.key"' | base64 -d > ${WORK_DIR}/certs/${FISHREG_PROJECT}-token-service.tls.key


# mongodb params
export MONGODB_USER="$(getServiceCredential mongodb_service_user)"
export MONGODB_PASSWORD="$(getServiceCredential mongodb_service_password)"
export MONGODB_DATABASE=fishreg
export MONGODB_HOST="127.0.0.1"
export MONGODB_PORT="43003"
if [ "${FISHREG_ENV}" == "prod" ]
then
  export MONGODB_PORT="44003"
fi
export MONGODB_TLS="true"
export MONGODB_TLS_KEY_FILE="${WORK_DIR}/certs/${FISHREG_PROJECT}-mongodb-client.tls.key"
export MONGODB_TLS_CERT_FILE="${WORK_DIR}/certs/${FISHREG_PROJECT}-mongodb-client.tls.crt"
export MONGODB_TLS_CA_FILE="${WORK_DIR}/certs/${FISHREG_PROJECT}-mongodb-client.ca.crt"


# generic service parameters
export POD_IP="127.0.0.1"
export LISTEN_PORT="${LISTEN_PORT:-43003}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4000}"

export TOKEN_SERVICE_SSL_CERT="${WORK_DIR}/certs/${FISHREG_PROJECT}-token-service.tls.crt"
export TOKEN_SERVICE_SSL_KEY="${WORK_DIR}/certs/${FISHREG_PROJECT}-token-service.tls.key"

# project parameters

tmux kill-session -t "fishreg-${FISHREG_ENV}-${FISHREG_PROJECT}-mongodb"

tmux new -s "fishreg-${FISHREG_ENV}-${FISHREG_PROJECT}-mongodb" -d "KUBECONFIG=${KUBECONFIG} kubectl -n fishreg-${FISHREG_ENV} port-forward service/mongodb-router ${MONGODB_PORT}:27017"
sleep 1


# node src/server.ts $@

ts-node src/server.ts $@ 

tmux kill-session -t "fishreg-${FISHREG_ENV}-${FISHREG_PROJECT}-mongodb"
