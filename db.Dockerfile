FROM redis:7.4.5-alpine

# copy over stuff the redis config needs
RUN mkdir -p /usr/local/etc/redis/db
COPY redis.conf /usr/local/etc/redis/redis.conf
