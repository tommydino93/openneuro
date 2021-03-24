FROM node:14.16.0 as dependencies

WORKDIR /srv

COPY bids-validator /home/nell/Git/crn/bids-validator/bids-validator

COPY . /srv

FROM dependencies as tests

RUN yarn test
