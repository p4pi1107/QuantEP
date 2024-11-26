FROM node:18

WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY . /app/frontend
RUN DISABLE_ESLINT_PLUGIN=true

RUN npm i

ENV PORT 3001
# Expose the necessary port
EXPOSE 3001

# Command to run the frontend
CMD ["npm", "start"]