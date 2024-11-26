FROM node:18

WORKDIR /app/backend

# Copy package.json and install dependencies
COPY . /app/backend/
RUN npm i ts-node typescript
RUN npm install


# Ensure the start script is executable
# Expose the necessary port
EXPOSE 3000

# Command to run the backend
CMD ["npm", "start"]