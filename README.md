# Flashcard Study App

A full-stack flashcard learning platform built with Next.js, React, Express, and MongoDB.
This app lets users create, organize, and study flashcards grouped into folders. It includes a speedrun and multiplayer mode, using Socket.io for real-time gameplay across multiple players
Currently deployed on AWS EC2 with a NGINX to custom domain cardsapp.

---

### Clone the repository

``` bash
git clone https://github.com/TaDavid7/mem_study.git
```

### Mongo_URL setup

For quick testing, make an account and project, where you should make a cluster (free version should be fine). Then click the connect option (drivers) and select node.js with a version 6.7 or later and copy the connection string you get. Remembering to replace the database password and username to what you set. Under network access, make sure to give whatever ip address your on access 

### Backend setup
```bash
cd backend
npm install
# in app.js add you mongo connection string or create a .env and set MONGO_URL = your-mongodb-url
npm run dev
```
In backend directory, create your own .env file and set <br>
CORS_ORIGIN = FRONTEND_CONNECTION <br>
MONGO_URL = YOUR_MONGO_URL <br>
PORT = CHOOSE_PORT <br>


### Frontend setup
In frontend setup(mem-study-next), create your own env.local and set <br>
NEXT_PUBLIC_API_BASE=http://localhost:5000 (or wherever your backend is
```bash
cd ../frontend
npm install
npm run dev
```

Open the app on http://localhost:3000 and it should be running

For any changes make to the backend, stop the frontend instance and the backend and rerun. Or if preferred, install nodemon if you want automatic refreshes.

---

### Testing app

To use the app, first create a folder named whatever you want and then create a card with a specified question and answer with the folder selected.
Congrats you have your first folder and flashcard. Create more flashcards if you want to check out other modes.

--- 
# Future improvements
- User authentication
- Import/export flashcard sets
- Use machine learning algorithms for spaced repetition as a study mode


# Author
Build by David T.
Perfect for expanding/testing your own studying purposes

## License
Licensed under the Apache License 2.0 – see the [LICENSE](LICENSE) file for details.









