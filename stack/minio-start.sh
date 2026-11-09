#!/bin/bash
source /root/gyra/.secrets/local-stack.env
export MINIO_ROOT_USER=$S3_ACCESS_KEY_ID
export MINIO_ROOT_PASSWORD=$S3_SECRET_ACCESS_KEY
exec /data/gyra-minio/bin/minio server /data/gyra-minio/data --address 127.0.0.1:9000 --console-address 127.0.0.1:9001
