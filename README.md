# Private Categorizer Project

## Setup Instructions

### 1. Install Dependencies

Install the required dependencies for the project:

```bash
cd media-server
npm install
```

```bash
cd media-viewer
npm install
```

// setup the database if it is custom, so db has tables if a new database
cd media-server

## Environment Configuration

Create a `.env` file in the project root with the following content (near init-db.sql):

```env
ROOT_DIRECTORY=D:/Your/Files/Path
DB_PATH=D:/Your/Files/Path/file_paths.db
MEDIA_SERVER_PORT=4000
ANGULAR_APP_PORT=4200
```

## Setup Database

Creates tables in .env DB_PATH and indexes all files in .env ROOT_DIRECTORY

```bash
cd tools
node index-folder.js
```

### Tags API

#### 1. Get All Tags

- **URL**: `GET /tags`
- **Response**: JSON array of all tags.

#### 2. Add a New Tag

- **URL**: `POST /tags`
- **Body** (JSON):
  ```json
  {
    "name": "example",
    "tag_group": "example-group",
    "color": "#abcdef"
  }
  ```
