FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

COPY certs/ /etc/nginx/certs

RUN rm /etc/nginx/conf.d/default.conf

EXPOSE 80 443
