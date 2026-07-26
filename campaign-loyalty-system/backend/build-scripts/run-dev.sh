#!/bin/bash
# Quick script to run in dev mode

export SPRING_PROFILES_ACTIVE=dev
export DB_USERNAME=dev_user
export DB_PASSWORD=dev_password

./run-app.sh run dev