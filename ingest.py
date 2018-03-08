#!/usr/bin/env python3
import sys
import os
import json
import uuid

root_dir = os.path.dirname(os.path.realpath(__file__))
data_dir = os.path.join(root_dir, 'data')
photo_dir = os.path.join(data_dir, 'photos')
data_file = os.path.join(data_dir, 'photo_data.json')
src_dir = os.path.abspath(sys.argv[1])
nickname = sys.argv[2]
password = sys.argv[3]

# Ensure photo directory exists
if not os.path.exists(src_dir):
    exit("That directory does not exist")

# Ensure data directory exists
if not os.path.exists(data_dir):
    os.makedirs(data_dir)
if not os.path.exists(photo_dir):
    os.makedirs(photo_dir)

# Load existing photo data
try:
    with open(data_file) as json_data:
        photo_data = json.load(json_data)
except FileNotFoundError:
    photo_data = {}

album_id = str(uuid.uuid4()).upper()
photos = []
album_dir = os.path.join(photo_dir, album_id)
os.makedirs(album_dir)

# Process photos
for photo in sorted(os.listdir(src_dir)):
    photo_id = str(uuid.uuid4()).upper()

    original_name = os.path.split(photo)[1]
    original_path = os.path.join(src_dir, original_name)

    new_name = photo_id + os.path.splitext(original_name)[1]
    new_path = os.path.join(album_dir, new_name)

    os.rename(original_path, new_path)
    photos.append({
        "id": photo_id,
        "filename": original_name,
        "display_name": new_name,
        "like": False
    })

# Save album information
album_data = {
    "photos": photos,
    "nickname": nickname,
    "password": password
}

photo_data[album_id] = album_data

with open(data_file, "w") as json_data:
    json.dump(photo_data, json_data)


print("Done. password string is {}#{}".format(album_id, password))