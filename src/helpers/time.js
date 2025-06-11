import dayjs from "dayjs";

const FormatToDate = (datetime) => {
  return dayjs(datetime).format('YYYY-MM-DD')
}


export {
  FormatToDate
}