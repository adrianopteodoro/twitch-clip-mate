# Twitch Clip Mate Template

PufferPanel 3 template for deploying Twitch Clip Mate applications.

## Requirements

- **Node.js** 16.0.0 or higher
- **npm** (comes with Node.js)
- **Playwright Chromium** (automatically installed during setup)

## Features

- Automated dependency installation
- Automatic Playwright Chromium browser download
- Configurable port (default: 3000)
- Support for Docker, Linux, and Windows environments
- Auto-restart on crashes

## Configuration

- **Port**: Set the port for the web interface (default: 3000)

## Environment Variables

The template sets the following environment variables:
- `PORT`: The port the application will listen on (configurable)

## Notes

- The installation process includes downloading Chromium, which may take a few minutes on first run
- The application requires internet access to fetch Twitch clip data
- Make sure the configured port is not already in use
- For Docker deployments, ensure sufficient disk space for Chromium installation (~200MB)

## Documentation

For more information about Twitch Clip Mate, visit: https://github.com/adrianopteodoro/twitch-clip-mate
