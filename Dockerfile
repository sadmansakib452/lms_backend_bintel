# Base image
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY yarn.lock ./

# Install app dependencies
RUN yarn install

# Bundle app source
COPY . .

# Copy the .env and .env.development files
COPY .env ./

# prisma generate
RUN npx prisma generate

# Creates a "dist" folder with the production build
# RUN yarn build

# Expose the port on which the app will run
EXPOSE 4000

# Start the server using the production build
# CMD ["yarn", "start:prod"]
# Start the server in dev mode
CMD ["yarn", "start:dev-swc"]