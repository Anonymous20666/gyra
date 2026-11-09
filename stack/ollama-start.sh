#!/bin/bash
export OLLAMA_MODELS=/data/ollama-models
export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_NUM_PARALLEL=1
exec /data/ollama/bin/ollama serve
