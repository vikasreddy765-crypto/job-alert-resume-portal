# Pathway — Job Alert and Resume Portal

A student-focused job portal built for the Web Technology project brief. Students can create an account, explore and save openings, upload a resume, apply, track applications, and create job alerts. Administrators can manage listings and review recent applications.

## Built with

- React and Vite
- Node.js and Express
- MongoDB and Mongoose
- Render Blueprint for deployment

## Run locally

You need Node.js 20 or newer and a MongoDB database. A free MongoDB Atlas cluster works for a class project.

1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI` to your MongoDB connection string and replace `JWT_SECRET` with a random secret of at least 24 characters.
3. Install the server packages with `npm install` and the website packages with `npm install --prefix client`.
4. Start the app with `npm run dev`.
5. Open the Vite address printed in the terminal (usually `http://localhost:5173`).

The first start adds sample job listings when the database has no jobs. The app does not include a shared demo password; create a student account from the sign-up form.

To seed an administrator account on the first start, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting the server. Use a strong password and keep `.env` private. Open **Admin dashboard** from the account navigation after signing in with that email.

## Deploy to Render

The included `render.yaml` describes a single Render web service that builds the React site and serves it from the Express server.

1. Put the contents of this folder in a Git repository and push it to GitHub or GitLab.
2. Create a MongoDB Atlas database and allow Render's service to connect to it. Copy its connection string.
3. In Render, choose **New → Blueprint**, connect the repository, and select this `render.yaml`.
4. Set the requested `MONGO_URI`. You can also set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to create the administrator on the first deploy.
5. Deploy. Check `/api/health` on the service URL; `database` should say `connected`.

Render generates `JWT_SECRET` from the Blueprint. Keep the MongoDB URI and administrator password private. The free web service may pause when idle and take a little time to wake up.

## Project behavior

- Job listings are public; sign in or create an account to save a role, set alerts, or apply.
- A resume can be a PDF, DOC, or DOCX file up to 5 MB. The file is stored in MongoDB and remains private until an application is submitted; each application keeps its own resume copy.
- Applications and saved jobs are tied to the signed-in account. A student can apply once to each role.
- Job alerts collect matching listings in the student's dashboard. This project does not send email notifications.
- The admin dashboard can add, edit, and remove listings, download application resumes, update application statuses, and show recent applications.
- The interface includes responsive layouts, keyboard focus states, and reduced-motion support.

## Useful commands

- `npm run dev` — run Vite and the API server for local development
- `npm run build` — build the production website
- `npm start` — start the production server (requires MongoDB environment variables)
