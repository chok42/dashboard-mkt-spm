

//-----------------------------------------------------------------------------------------
//date
//-----------------------------------------------------------------------------------------
export const toThaiDateTimeString = (date: Date | string | number) => {
  const dataDate = new Date(date)
  const datetoThai = dataDate.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: "numeric",
    minute: 'numeric',
    second: "numeric",
    timeZone: "Asia/Bangkok",
    formatMatcher: 'basic',
  })
  return datetoThai
};

export const toThaiTimeString = (date: Date | string | number) => {
  const dataDate = new Date(date)
  const datetoThai = dataDate.toLocaleDateString('th-TH', {
    hour: "numeric",
    minute: 'numeric',
    second: "numeric",
    timeZone: "Asia/Bangkok",
    formatMatcher: 'basic',
  })
  return datetoThai
};

export const toThaiDateString = (date: Date | string | number) => {
  const dataDate = new Date(date)
  const datetoThai = dataDate.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    formatMatcher: 'basic',
  })
  return datetoThai
};
//------------------------------------
//GoogleDrive
//------------------------------------
export const convertDriveImage = (url: string) => {
  //ConvertDriveLinkToDirectImage
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
    //return `https://drive.google.com/uc?id=${fileId}`;
  }
  return ""; // or handle invalid format
};

//-----------------------------------------------------------------------------------------
//number
//-----------------------------------------------------------------------------------------
export const currencyFormat = (num: number) => {
  return num ? num?.toFixed(2)?.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "0";
};
//-----------------------------------------------------------------------------------------
//word
//-----------------------------------------------------------------------------------------
export const lengthTextFormat = (text: string, maxText: number) => {
  return text?.length > maxText
    ? text.substring(0, maxText - 3) + "..."
    : text;

}

export const inputLengthThailand = (e: React.ChangeEvent<HTMLInputElement>) => {
  return e.target.value.replace(/[^ก-๛']/g, '')

}

export const inputLengthEnglish = (value: string) => {
  return value.replace(/[^a-zA-Z0-9']/g, '')

}

export const inputEnglishUppercase = (value: string) => {
  return value.replace(/[^A-Z0-9']/g, '')
}

export const inputNumber = (value: string) => {
  return value.replace(/[^0-9']/g, '')
}


