FROM node:18-alpine As development
ENV NODE_ENV development
# Add a work directory
WORKDIR /usr/src/app
# Cache and Install dependencies
COPY package.json .
RUN npm install nodemon
RUN npm install
# Copy app files
COPY . .
# Expose port
EXPOSE 3000


