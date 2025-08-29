# Fastify TypeScript App

A simple TypeScript Fastify application with Hello World endpoints.

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the app in development mode with auto-reload:

```bash
npm run dev:watch
```

Or run once:

```bash
npm run dev
```

### Build

Build the TypeScript code:

```bash
npm run build
```

### Production

Run the built application:

```bash
npm start
```

## Endpoints

- `GET /` - Returns a simple "Hello World!" message
- `GET /hello/:name` - Returns a personalized greeting
- `GET /health` - Health check endpoint

## Environment Variables

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: localhost)

## Example Usage

```bash
# Basic hello world
curl http://localhost:3000/

# Personalized greeting
curl http://localhost:3000/hello/John

# Health check
curl http://localhost:3000/health
```
