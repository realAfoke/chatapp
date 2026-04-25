#!/bin/bash
echo "BUILD.SH IS RUNNING"
python manage.py migrate
python manage.py collectstatic --noinput

daphne -b 0.0.0.0 -p 8000 core.asgi:application


