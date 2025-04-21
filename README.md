# Twitch Clip Mate

Twitch Clip Mate is a Node.js application that allows users to extract and play MP4 URLs from Twitch embed links. It provides a simple web interface and an API for retrieving MP4 URLs from Twitch clips.

---

## Features
- Extract MP4 URLs from Twitch embed links.
- Auto-add or replace the `&parent` parameter in Twitch embed URLs.
- API documentation using Swagger.
- Simple web interface with a form to test the functionality.
- Video preview with autoplay and download options.

---

## Requirements
- Node.js (v18 or later)
- npm (Node Package Manager)

---

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/adrianopteodoro/twitch-clip-mate.git
   cd twitch-clip-mate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Development mode (with auto-reload):
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

---

## API Documentation
The API documentation is available at:
```
http://localhost:3000/api-docs
```

### `/get-mp4` Endpoint
- **Method**: `GET`
- **Description**: Extracts the MP4 URL from a Twitch embed URL.
- **Query Parameters**:
  - `url` (required): The Twitch embed URL.
    - Example: `https://clips.twitch.tv/embed?clip=IncredulousBigCoyotePastaThat-mlf24oYJpnTA4C-v`
- **Responses**:
  - `200`: Successfully retrieved the MP4 URL.
  - `400`: Missing or invalid URL parameter.
  - `404`: No `.mp4` URL found.
  - `500`: Error executing the Playwright script.

---

## How to Get an Embed URL
1. **Find the Embed Code**:
   Look for the embed code of a Twitch clip, which looks like this:
   ```html
   <iframe src="https://clips.twitch.tv/embed?clip=IncredulousBigCoyotePastaThat-mlf24oYJpnTA4C-v&parent=www.example.com" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe>
   ```

2. **Copy the `src` Attribute**:
   Extract the value inside the `src` attribute:
   ```
   https://clips.twitch.tv/embed?clip=IncredulousBigCoyotePastaThat-mlf24oYJpnTA4C-v&parent=www.example.com
   ```

3. **Remove the `&parent` Parameter (Optional)**:
   If the `&parent` parameter exists, you can remove it:
   ```
   https://clips.twitch.tv/embed?clip=IncredulousBigCoyotePastaThat-mlf24oYJpnTA4C-v
   ```

4. **Paste the URL**:
   Use the extracted URL in the form or API.

---

## Technologies Used
- **Node.js**: Backend runtime.
- **Express**: Web framework for building the server.
- **Playwright**: Browser automation for extracting MP4 URLs.
- **Pug**: Template engine for rendering views.
- **Swagger**: API documentation.
- **Bootstrap**: Front-end styling for a responsive UI.

---

## Contributing
Contributions are welcome! If you'd like to contribute:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

---

## License
This project is licensed under the GNU General Public License v3.0. See the [LICENSE](./LICENSE) file for details.

---

## Contact
For questions or feedback, feel free to reach out:
- **GitHub**: [https://github.com/adrianopteodoro](https://github.com/adrianopteodoro)

Enjoy using **Twitch Clip Mate**! 🎉