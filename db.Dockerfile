FROM redis:8-alpine

RUN apk update \
    && apk upgrade

# copy over stuff the redis config needs
RUN mkdir -p /usr/local/etc/redis/db
COPY redis.conf /usr/local/etc/redis/redis.conf
