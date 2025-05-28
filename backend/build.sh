set -o errexit

pip install -r requirnments.txt

python manage.py collectstatic --no-input

python manage.py migrate