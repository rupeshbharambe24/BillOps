FROM node:20-slim

WORKDIR /app

COPY frontend/package.json ./package.json
RUN npm install

COPY frontend ./

ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
