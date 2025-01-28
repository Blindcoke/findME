# FindMe

This project is an application made to help Ukrainian people find their lost relatives, friends, colleagues, associates.

## Features

- Front-End React
- Back-End Django
- Users can check people that are currently searched, informated about, deceased and reunited.
- Minimalistic design
- Dockerized for easy setup and deployment

## Prerequisites

Before starting, ensure you have the following installed on your system:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Blindcoke/findME
cd findme
```
### 2. Create Environment Files
The project requires specific environment variables for both db and frontend.

- Db in the root dir:
Create a .env file in the root directory with the db parameters
- Front-End in the frontend folder:
Create an .env with your localhost backend url

### 3. Build and Start the Application
Use Docker Compose to build and start the application:
```bash
docker-compose up --build
```
The command will:

-Build and serve the React frontend.
-Start the Django backend and PostgreSQL database.
-Expose the frontend at http://localhost:5173 and the backend API at http://localhost:8000.


## License

This project is proprietary and not open for public use.  
**All rights reserved** © 2025 
