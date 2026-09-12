FROM node:22-bookworm-slim
USER root
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl tree \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /home/user
RUN npm create vite@9.2.1 react-app -- --template react --no-interactive \
    && cd react-app && npm install \
    && npm install --save-exact tailwindcss@4.3.3 @tailwindcss/vite@4.3.3 react-router-dom react-icons
COPY src/ /home/user/react-app/src/
COPY vite.config.js /home/user/react-app/vite.config.js
RUN chown -R user:user /home/user/react-app && npm cache clean --force
USER user
WORKDIR /home/user/react-app
