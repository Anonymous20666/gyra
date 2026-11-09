#!/bin/bash
GW=$(docker network inspect gyra-net -f '{{range .IPAM.Config}}{{.Gateway}}{{end}}')
exec /data/gyra-moto/bin/moto_server -H "$GW" -p 9000
