//validate phone number
// Require `PhoneNumberFormat`.
import googleLib from 'google-libphonenumber';
const PNF = googleLib.PhoneNumberFormat;
// const {isValidCountryCode} = require("../config/countries")

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = googleLib.PhoneNumberUtil.getInstance();

const phoneParserAndValidate = async(phoneNumber="", countryCode="")=>{
    // Parse number with country code and keep raw input.
    //202-456-1414
    const number = phoneUtil.parseAndKeepRawInput(phoneNumber, countryCode);

    // Print the phone's country code.
    const phoneCountryCode = number.getCountryCode()
    //console.log(phoneCountryCode);
    // => 1

    // Print the phone's national number.
    const phoneNational = number.getNationalNumber()
    //console.log(phoneNational);
    // => 2024561414

    // Print the phone's extension.
    const phoneExtension = number.getExtension()
    //console.log(phoneExtension);
    // =>

    // Print the phone's extension when compared to i18n.phonenumbers.CountryCodeSource.
    const phoneExtension2 = number.getCountryCodeSource()
    //console.log(phoneExtension2);
    // => FROM_DEFAULT_COUNTRY

    // Print the phone's italian leading zero.
    const phoneItalianLeading = number.getItalianLeadingZero()
    //console.log(phoneItalianLeading);
    // => false

    // Print the phone's raw input.
    const phoneRawInput = number.getRawInput()
    //console.log(phoneRawInput);
    // => 202-456-1414

    // Result from isPossibleNumber().
    const phoneIsPossibleNumber = phoneUtil.isPossibleNumber(number)
    //console.log(phoneIsPossibleNumber);
    // => true

    // Result from isValidNumber().
    const phoneIsValidNumber = phoneUtil.isValidNumber(number)
    //console.log(phoneIsValidNumber);
    // => true

    // Result from isValidNumberForRegion().
    const phoneIsValidNumberForRegion = phoneUtil.isValidNumberForRegion(number, countryCode)
    //console.log(phoneIsValidNumberForRegion);
    // => true

    // Result from getRegionCodeForNumber().
    const phoneGetRegionCodeForNumber = phoneUtil.getRegionCodeForNumber(number)
    //console.log(phoneGetRegionCodeForNumber);
    // => US

    // Result from getNumberType() when compared to i18n.phonenumbers.PhoneNumberType.
    const phoneGetNumberType = phoneUtil.getNumberType(number)
    //console.log(phoneGetNumberType);
    // => FIXED_LINE_OR_MOBILE

    // Format number in the E164 format.
    const phoneE164Format = phoneUtil.format(number, PNF.E164)
    //console.log(phoneE164Format);
    // => +12024561414

    // Format number in the original format.
    const phoneNumberInOriginalFormat = phoneUtil.formatInOriginalFormat(number, countryCode)
    //console.log(phoneNumberInOriginalFormat);
    // => (202) 456-1414

    // Format number in the national format.
    const phoneNumberFormatInNational = phoneUtil.format(number, PNF.NATIONAL)
    //console.log(phoneNumberFormatInNational);
    // => (202) 456-1414

    // Format number in the international format.
    const phoneNumberInInternationalFormat = phoneUtil.format(number, PNF.INTERNATIONAL)
    //console.log(phoneNumberInInternationalFormat);
    // => +1 202-456-1414

    // Format number in the out-of-country format from US.
    const phoneOutOfCountryFormatFromUS = phoneUtil.formatOutOfCountryCallingNumber(number, 'US')
    //console.log(phoneOutOfCountryFormatFromUS);
    // => 1 (202) 456-1414

    // Format number in the out-of-country format from CH.
    const phoneOutOfCountryFormatFromCH = phoneUtil.formatOutOfCountryCallingNumber(number, 'CH')
    //console.log(phoneOutOfCountryFormatFromCH);
    // => 00 1 202-456-1414

    // let phoneUnique = (phoneE164Format.replace("+", ""))
    let phoneUnique = phoneE164Format
    // if(phoneIsValidNumber){
    //     phoneUnique = Number(phoneUnique)
    // }
    return {
        //number,
        country:countryCode,
        dialingCode:phoneCountryCode,
        nationalNumber:phoneNational,
        //phoneExtension,
        //phoneExtension2,
        //phoneItalianLeading,
        //phoneRawInput,
        //phoneIsPossibleNumber,
        isValidNumber:phoneIsValidNumber,
        phoneIsValidNumberForRegion,
        //phoneGetRegionCodeForNumber,
        //phoneGetNumberType,
        number:phoneUnique,//its including country code
        //phoneNumberInOriginalFormat,
        //phoneNumberFormatInNational,
        //phoneNumberInInternationalFormat,
        //phoneOutOfCountryFormatFromUS,
        //phoneOutOfCountryFormatFromCH
    }
}




// const allowedDialingCodes = async()=>{
//     console.log("app.env", process.env.APP_ENV)

//     if(process.env.APP_ENV === "production"){
//         return {
//             "1":"1",
//             "62":"62"
//         }
//     }else{
//         return {
//             "1":"1",
//             "62":"62",
//             "880":"880",
//             "91":"91"
//         }
//     }
    
// }

// const isDialingCodeAllowed = async(dialingCode)=>{

//     try{
//         const allowedCodes = Object.keys((await allowedDialingCodes()))
//         console.log("allowedCodes", allowedCodes)
//         return allowedCodes.includes(String(dialingCode))
//     }catch(e){
//         console.log(e)
//         return false
//     }

// }

//validate phone and dialing codes
const phoneAndCodeValidator = async(phoneNumber, countryCode)=>{
    if(!phoneNumber || phoneNumber == ""){
        return `The phone number is required`
    }

    if(!countryCode || countryCode == ""){
        return `The country code is required`
    }

    countryCode = countryCode.toUpperCase()

    const response = await phoneParserAndValidate(phoneNumber, countryCode)
    console.log(response)
    if(response.phoneIsValidNumberForRegion ===false){
        return "Invalid phone region/country!"
    }
    if(response.isValidNumber &&response.country ==countryCode ){
        return response
    }else{
        return "The phone number is invalid"
    }

    // try{
    //     Number(dialing_code)
    // }catch(e){
    //     return `The dialing code is invalid, it should be a number`
    // }

    // if(!(await isDialingCodeAllowed(dialing_code))){
    //     return `The dialing code ${dialing_code} is not allowed`
    // }

    // dialing_code = Number(dialing_code)
    // let phoneLength;
    
    // if(dialing_code == 1){
    //     phoneLength = [10]
    // }else if(dialing_code == 62){
    //     phoneLength = [10]
    // }else if(dialing_code == 880){
    //     phoneLength = [10]
    // }else if(dialing_code == 91){
    //     phoneLength = [10]
    // }


    // phone = `${phone}`
    // totalDigits = phone.length

    // if(!phoneLength.includes(totalDigits)){
    //     return `The phone number must be ${phoneLength} digits`
    // }
    // return true
}

export {
    phoneAndCodeValidator
};
