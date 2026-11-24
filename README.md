# ApplyDesk

ApplyDesk prepares German and English application drafts and tracks applications
from LinkedIn and Stepstone Germany. Paste a posting link and its description,
enter the role and company, then review the suggested CV bullets and cover letter.
Use **Open posting** when you're ready to apply, then update the application status.

## Run the packaged build

If you have Python 3, run this command from the extracted project folder:

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open <http://127.0.0.1:8000> in your browser. On Windows, use `py` if
`python` isn't available on your PATH. Keep the same host and port when
reopening the app to access your existing drafts.

## Develop the React app

Use Node.js 22.12 or newer.

```sh
npm install
npm run dev
npm run build
```

Drafts use keyword matching against the experience entries in
`application.mjs`. Review those entries before using a draft or edit the file
to customize your profile. Applications and edits are stored in the browser.
The app doesn't fetch job descriptions, connect to your accounts, or submit
applications. Use the built-in download to keep a copy of a draft.
