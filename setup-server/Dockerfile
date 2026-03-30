FROM node:20-alpine
WORKDIR /app
COPY ./setup-server/index.js ./index.js
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]

