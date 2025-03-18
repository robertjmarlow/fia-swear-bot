FROM redis:7.4.2-alpine

COPY redis.conf /usr/local/etc/redis/redis.conf
RUN mkdir /usr/local/etc/redis/db
