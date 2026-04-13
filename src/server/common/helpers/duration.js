const SECONDS_IN_MINUTE = 60
const MINUTES_IN_HOUR = 60
const MILLIS_IN_SECOND = 1000

const TWO = 2
const FIVE = 5
const TEN = 10
const FIFTEEN = 15
const EIGHT = 8

export const milliseconds = {
  tenSeconds: TEN * MILLIS_IN_SECOND,
  fiveMinutes: FIVE * SECONDS_IN_MINUTE * MILLIS_IN_SECOND
}

export const seconds = {
  twoMinutes: TWO * SECONDS_IN_MINUTE,
  fiveMinutes: FIVE * SECONDS_IN_MINUTE,
  tenMinutes: TEN * SECONDS_IN_MINUTE,
  fifteenMinutes: FIFTEEN * SECONDS_IN_MINUTE,
  eightHours: EIGHT * MINUTES_IN_HOUR * SECONDS_IN_MINUTE
}

export const unixEpoch = () => Math.round(Date.now() / MILLIS_IN_SECOND)
